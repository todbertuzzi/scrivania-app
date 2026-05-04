import { useState, useEffect, useCallback, useRef } from 'react';
import { pusherService } from '../services/pusher';

export const useSharedState = () => {
  const [sessionData, setSessionData] = useState({
    carte: [],
    planciaZoom: 1,
    planciaPosition: { x: 0, y: 0 },
  });
  const [sessionSettings, setSessionSettings] = useState({
    mazzoId: 0,
  });

  const [role, setRole] = useState('viewer');
  const [permissions, setPermissions] = useState({
    canRead: true,
    canWrite: false,
    canSpawn: false,
    canManageMembers: false,
  });
  const [accessRevoked, setAccessRevoked] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [stateVersion, setStateVersion] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  const sessionIdRef = useRef(null);
  const stateVersionRef = useRef(1);
  const sessionDataRef = useRef(sessionData);
  const sessionSettingsRef = useRef(sessionSettings);
  const tokenRef = useRef(null);
  const myUserIdRef = useRef(null);
  const restNonceRef = useRef(null);

  const dirtyRef = useRef(false);
  const saveTimerRef = useRef(null);
  const refetchTimerRef = useRef(null);
  const isSavingRef = useRef(false);
  const isRefetchingRef = useRef(false);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    stateVersionRef.current = stateVersion;
  }, [stateVersion]);

  useEffect(() => {
    sessionDataRef.current = sessionData;
  }, [sessionData]);

  useEffect(() => {
    sessionSettingsRef.current = sessionSettings;
  }, [sessionSettings]);

  const isLocalEnvironment = () => {
    return window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
  };

  const getNonce = () => {
    if (restNonceRef.current) return restNonceRef.current;

    const root = document?.querySelector?.('#root');
    const dsNonce = root?.dataset?.restNonce;
    if (dsNonce) return dsNonce;

    const cfg = window?.scrivaniaPusherConfig;
    if (cfg?.nonce) return cfg.nonce;
    if (cfg?.rest_nonce) return cfg.rest_nonce;
    if (window?.wpApiSettings?.nonce) return window.wpApiSettings.nonce;
    return null;
  };

  const getAjaxUrl = () => {
    const root = document?.querySelector?.('#root');
    const dsUrl = root?.dataset?.ajaxUrl;
    if (dsUrl) return dsUrl;

    // Alcuni temi/plugin espongono ajaxurl globalmente.
    if (typeof window !== 'undefined' && typeof window.ajaxurl === 'string' && window.ajaxurl) {
      return window.ajaxurl;
    }

    // Fallback: installazione WP standard in root.
    return '/wp-admin/admin-ajax.php';
  };

  const fetchFreshRestNonce = useCallback(async () => {
    try {
      const ajaxUrl = getAjaxUrl();
      const res = await fetch(ajaxUrl, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: new URLSearchParams({ action: 'scrivania_rest_nonce' }),
      });

      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      const nonce = data?.data?.nonce;
      if (typeof nonce === 'string' && nonce.length > 5) {
        restNonceRef.current = nonce;

        // Allinea anche il nonce usato da Pusher auth (header X-WP-Nonce).
        if (typeof window !== 'undefined') {
          const prev = window.scrivaniaPusherConfig || {};
          window.scrivaniaPusherConfig = {
            ...prev,
            nonce,
            rest_nonce: nonce,
          };
        }

        return nonce;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const apiFetch = async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    const nonce = getNonce();
    if (nonce) {
      headers.set('X-WP-Nonce', nonce);
    }
    return fetch(url, { credentials: 'include', ...options, headers });
  };

  const resolveSession = useCallback(async (token) => {
    const response = await apiFetch('/wp-json/scrivania/v1/get-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Errore get-session (${response.status}): ${text}`);
    }

    return response.json();
  }, []);

  const roleToPermissions = (nextRole) => {
    if (nextRole === 'admin') {
      return { canRead: true, canWrite: true, canSpawn: true, canManageMembers: true };
    }
    if (nextRole === 'editor') {
      return { canRead: true, canWrite: true, canSpawn: false, canManageMembers: false };
    }
    return { canRead: true, canWrite: false, canSpawn: false, canManageMembers: false };
  };

  const refetchSnapshot = useCallback(async (sessionIdToFetch) => {
    if (!sessionIdToFetch || isLocalEnvironment()) return;
    if (isRefetchingRef.current) return;
    isRefetchingRef.current = true;

    try {
      const response = await apiFetch(`/wp-json/scrivania/v1/session/${sessionIdToFetch}/snapshot`, {
        method: 'GET',
      });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      if (data?.snapshot) {
        setSessionData(data.snapshot);
        sessionDataRef.current = data.snapshot;
      }
      if (typeof data?.state_version === 'number') {
        setStateVersion(data.state_version);
        stateVersionRef.current = data.state_version;
      }
      dirtyRef.current = false;
    } finally {
      isRefetchingRef.current = false;
    }
  }, []);

  const setupPusherListeners = useCallback(() => {
    pusherService.subscribe('state-updated', (data) => {
      const incomingVersion = Number(data?.state_version || 0);
      if (!incomingVersion) return;

      // Se sto modificando localmente, lascio che il salvataggio gestisca eventuali conflitti (409)
      if (dirtyRef.current || isSavingRef.current) return;

      // Skip se già aggiornati
      if (incomingVersion <= (stateVersionRef.current || 0)) return;

      // Coalescing refetch
      if (refetchTimerRef.current) {
        clearTimeout(refetchTimerRef.current);
      }
      refetchTimerRef.current = setTimeout(() => {
        refetchSnapshot(sessionIdRef.current);
      }, 200);
    });

    // Aggiornamenti ruolo in realtime (inclusa revoca)
    pusherService.subscribe('member-role-updated', (data) => {
      const uid = data?.user_id ? String(data.user_id) : null;
      if (!uid) return;
      if (!myUserIdRef.current) return;
      if (String(myUserIdRef.current) !== uid) return;

      const nextRole = data?.role ? String(data.role) : null;
      if (!nextRole) return;

      if (nextRole === 'removed' || nextRole === 'revoked') {
        setAccessRevoked(true);
        setRole('viewer');
        setPermissions(roleToPermissions('viewer'));
        try {
          pusherService.disconnect();
        } catch {
          // ignore
        }
        return;
      }

      // viewer/editor: aggiorna permessi al volo
      if (nextRole === 'viewer' || nextRole === 'editor' || nextRole === 'admin') {
        setAccessRevoked(false);
        setRole(nextRole);
        setPermissions(roleToPermissions(nextRole));
      }
    });
  }, [refetchSnapshot]);

  const flushSave = useCallback(async (reason = 'end-gesture') => {
    if (isLocalEnvironment()) return;
    if (!permissions.canWrite) return;
    if (!dirtyRef.current) return;
    const sessionIdToSave = sessionIdRef.current;
    if (!sessionIdToSave) return;
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    try {
      const snapshotToSave = sessionDataRef.current;
      const settingsToSave = sessionSettingsRef.current;
      const baseVersion = Number(stateVersionRef.current || 0);
      const response = await apiFetch(`/wp-json/scrivania/v1/session/${sessionIdToSave}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_version: baseVersion,
          sessione: settingsToSave,
          snapshot: snapshotToSave,
          reason,
        }),
      });

      if (response.status === 409) {
        // Conflitto: refetch e annulla dirty locale
        await refetchSnapshot(sessionIdToSave);
        return;
      }

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (typeof data?.state_version === 'number') {
        setStateVersion(data.state_version);
        stateVersionRef.current = data.state_version;
      }
      dirtyRef.current = false;
    } finally {
      isSavingRef.current = false;
    }
  }, [permissions.canWrite, refetchSnapshot]);

  const scheduleSave = useCallback((reason = 'end-gesture', debounceMs = 600) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      flushSave(reason);
    }, debounceMs);
  }, [flushSave]);

  const markDirty = () => {
    dirtyRef.current = true;
  };

  // Inizializzazione
  useEffect(() => {
    const initializeSession = async () => {
      const container = document.querySelector('#root');
      const token = container?.dataset?.token;
      const myUserId = container?.dataset?.userId;
      myUserIdRef.current = myUserId ? String(myUserId) : null;
      if (!token && !isLocalEnvironment()) {
        console.error('Token sessione mancante');
        return;
      }

      if (isLocalEnvironment()) {
        setSessionSettings({ mazzoId: 0 });
        setRole('admin');
        setPermissions({ canRead: true, canWrite: true, canSpawn: true, canManageMembers: true });
        setIsInitialized(true);
        return;
      }

      try {
        setInitError(null);
        tokenRef.current = token;

        // Nonce REST fresco (evita rest_cookie_invalid_nonce in presenza di cache)
        await fetchFreshRestNonce();

        const session = await resolveSession(token);
        const newSessionId = session.session_id;
        setSessionId(newSessionId);
        sessionIdRef.current = newSessionId;

        setRole(session.role || 'viewer');
        setPermissions(session.permissions || { canRead: true, canWrite: false, canSpawn: false, canManageMembers: false });

        const nextSettings = session?.sessione && typeof session.sessione === 'object'
          ? session.sessione
          : {};
        const snapshotCards = Array.isArray(session?.snapshot?.carte) ? session.snapshot.carte : [];
        const inferredDeckId = Number(snapshotCards.find((card) => Number.isFinite(Number(card?.mazzoId)))?.mazzoId);
        const nextDeckId = Number(nextSettings.mazzoId);
        setSessionSettings({
          ...nextSettings,
          mazzoId: Number.isFinite(nextDeckId)
            ? (nextDeckId === 0 && Number.isFinite(inferredDeckId) && inferredDeckId > 0 ? inferredDeckId : nextDeckId)
            : (Number.isFinite(inferredDeckId) ? inferredDeckId : 0),
        });

        const newVersion = session.state_version || 1;
        setStateVersion(newVersion);
        stateVersionRef.current = newVersion;
        if (session.snapshot) {
          setSessionData(session.snapshot);
        }

        await pusherService.init(newSessionId);
        setupPusherListeners();

        setIsInitialized(true);
      } catch (e) {
        console.error('Init scrivania fallita:', e);
        setInitError(e?.message || 'Errore inizializzazione');
        setIsInitialized(true);
      }
    };

    initializeSession();

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
      pusherService.disconnect();
    };
  }, [resolveSession, setupPusherListeners, fetchFreshRestNonce]);

  const updateCards = useCallback((carte) => {
    if (!permissions.canWrite) return;
    setSessionData(prev => ({ ...prev, carte }));
    markDirty();
  }, [permissions.canWrite]);

  const updatePlancia = useCallback((zoom, position) => {
    if (!permissions.canWrite) return;
    setSessionData(prev => ({ ...prev, planciaZoom: zoom, planciaPosition: position }));
    markDirty();
  }, [permissions.canWrite]);

  const moveCard = useCallback((cardId, x, y) => {
    if (!permissions.canWrite) return;
    setSessionData(prev => ({
      ...prev,
      carte: prev.carte.map(carta => (carta.id === cardId ? { ...carta, x, y } : carta)),
    }));
    markDirty();
  }, [permissions.canWrite]);

  const rotateCard = useCallback((cardId, angle) => {
    if (!permissions.canWrite) return;
    setSessionData(prev => ({
      ...prev,
      carte: prev.carte.map(carta => (carta.id === cardId ? { ...carta, angle } : carta)),
    }));
    markDirty();
  }, [permissions.canWrite]);

  const scaleCard = useCallback((cardId, scale) => {
    if (!permissions.canWrite) return;
    setSessionData(prev => ({
      ...prev,
      carte: prev.carte.map(carta => (carta.id === cardId ? { ...carta, scale } : carta)),
    }));
    markDirty();
  }, [permissions.canWrite]);

  return {
    sessionData,
    sessionSettings,
    role,
    permissions,
    sessionId,
    stateVersion,
    accessRevoked,
    isInitialized,
    initError,
    updateCards,
    updatePlancia,
    moveCard,
    rotateCard,
    scaleCard,
    scheduleSave,
    flushSave,
  };
};