import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LuUsers, LuPanelRightClose, LuShieldCheck, LuEye, LuPencil } from 'react-icons/lu';
import { pusherService } from '../services/pusher';

const SidebarUtenti = ({ sessionId, permissions, role, onClose, closeButtonRef }) => {
  const [membersById, setMembersById] = useState({});
  const [rolesByUserId, setRolesByUserId] = useState({});
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [rolesError, setRolesError] = useState(null);

  const myUserId = useMemo(() => {
    const container = document.querySelector('#root');
    return container?.dataset?.userId ? String(container.dataset.userId) : null;
  }, []);

  const apiFetch = useCallback(async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    const nonce = window?.scrivaniaPusherConfig?.nonce;
    if (nonce) headers.set('X-WP-Nonce', nonce);
    return fetch(url, { ...options, headers });
  }, []);

  const canManageMembers = Boolean(permissions?.canManageMembers) || role === 'admin';

  const fetchRoles = useCallback(async () => {
    if (!canManageMembers) return;
    if (!sessionId) return;

    setIsLoadingRoles(true);
    setRolesError(null);
    try {
      const res = await apiFetch(`/wp-json/scrivania/v1/session/${sessionId}/members`, { method: 'GET' });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const map = {};
      (data?.members || []).forEach((m) => {
        map[String(m.user_id)] = m.role;
      });
      setRolesByUserId(map);
    } catch (e) {
      setRolesError(e?.message || 'Errore caricamento ruoli');
    } finally {
      setIsLoadingRoles(false);
    }
  }, [apiFetch, canManageMembers, sessionId]);

  const setMemberRole = useCallback(async (userId, nextRole) => {
    if (!canManageMembers) return;
    if (!sessionId) return;
    const uid = String(userId);

    setRolesByUserId((prev) => ({ ...prev, [uid]: nextRole }));
    try {
      const res = await apiFetch(`/wp-json/scrivania/v1/session/${sessionId}/members/${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!res.ok) {
        await fetchRoles();
      }
    } catch {
      await fetchRoles();
    }
  }, [apiFetch, canManageMembers, fetchRoles, sessionId]);

  const revokeMember = useCallback(async (userId) => {
    if (!canManageMembers) return;
    if (!sessionId) return;
    const uid = String(userId);

    const ok = window.confirm('Revocare l\'accesso a questo utente?');
    if (!ok) return;

    setRolesByUserId((prev) => ({ ...prev, [uid]: 'removed' }));
    try {
      const res = await apiFetch(`/wp-json/scrivania/v1/session/${sessionId}/members/${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove' }),
      });
      if (!res.ok) {
        await fetchRoles();
      }
    } catch {
      await fetchRoles();
    }
  }, [apiFetch, canManageMembers, fetchRoles, sessionId]);

  const members = useMemo(() => {
    return Object.values(membersById)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [membersById]);

  useEffect(() => {
    if (!pusherService.isReady()) {
      return;
    }

    const syncMembers = (m) => {
      const next = {};
      try {
        m.each((member) => {
          next[String(member.id)] = {
            id: String(member.id),
            name: member?.info?.name || member?.info?.display_name || `User ${member.id}`,
            avatar_url: member?.info?.avatar_url || null,
          };
        });
      } catch {
        // ignore
      }
      setMembersById(next);
    };

    // Se la sidebar viene riaperta, il canale presence è già sottoscritto e
    // l'evento `pusher:subscription_succeeded` non verrà ri-emesso: recupera lo snapshot.
    const existingMembers = pusherService.getPresenceMembers();
    if (existingMembers && typeof existingMembers.each === 'function') {
      syncMembers(existingMembers);
    }

    const offSucceeded = pusherService.subscribe('pusher:subscription_succeeded', (m) => {
      syncMembers(m);
    });

    const offAdded = pusherService.subscribe('pusher:member_added', (member) => {
      fetchRoles();
      setMembersById((prev) => ({
        ...prev,
        [String(member.id)]: {
          id: String(member.id),
          name: member?.info?.name || member?.info?.display_name || `User ${member.id}`,
          avatar_url: member?.info?.avatar_url || null,
        },
      }));
    });

    const offRemoved = pusherService.subscribe('pusher:member_removed', (member) => {
      setMembersById((prev) => {
        const next = { ...prev };
        delete next[String(member.id)];
        return next;
      });
    });

    return () => {
      offSucceeded();
      offAdded();
      offRemoved();
    };
  }, [fetchRoles]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (!pusherService.isReady()) return;

    const off = pusherService.subscribe('member-role-updated', (data) => {
      const uid = data?.user_id ? String(data.user_id) : null;
      const nextRole = data?.role ? String(data.role) : null;
      if (!uid || !nextRole) return;

      if (canManageMembers) {
        setRolesByUserId((prev) => ({ ...prev, [uid]: nextRole }));
      }
    });

    return () => off();
  }, [canManageMembers]);

  const isConnected = pusherService.isReady();

  return (
    <section className="scrivania-members" aria-labelledby="scrivania-members-title">
      <header className="scrivania-members-header">
        <span className="scrivania-members-symbol" aria-hidden="true"><LuUsers size={20} /></span>
        <div className="scrivania-members-heading">
          <h2 id="scrivania-members-title">Partecipanti</h2>
          <p className="scrivania-members-presence" role="status">
            <span className={`scrivania-presence-dot ${isConnected ? 'is-connected' : ''}`} aria-hidden="true" />
            {isConnected ? `${members.length} ${members.length === 1 ? 'persona online' : 'persone online'}` : 'Connessione non attiva'}
          </p>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          className="scrivania-sidebar-close"
          onClick={onClose}
          aria-label="Chiudi pannello partecipanti"
          aria-controls="scrivania-members-panel"
          aria-expanded="true"
          title="Chiudi partecipanti"
        >
          <LuPanelRightClose size={18} />
        </button>
      </header>

      <div className="scrivania-members-body">
        {canManageMembers && (
          <p className="scrivania-members-hint">Scegli chi può modificare la scrivania.</p>
        )}
        {canManageMembers && isLoadingRoles && <p className="scrivania-members-hint" role="status">Caricamento permessi…</p>}
        {canManageMembers && rolesError && (
          <p className="scrivania-members-error" role="alert">Impossibile aggiornare i permessi. Riprova tra poco.</p>
        )}

        {members.length === 0 && (
          <div className="scrivania-members-empty">
            <LuUsers size={28} aria-hidden="true" />
            <p>{isConnected ? 'In attesa dei partecipanti' : 'Elenco partecipanti non disponibile'}</p>
            <span>{isConnected ? 'Le persone collegate compariranno qui.' : 'L’elenco si aggiornerà quando la connessione sarà disponibile.'}</span>
          </div>
        )}

        <ul className="scrivania-members-list">
          {members.map((utente) => {
            const isMe = myUserId && String(utente.id) === String(myUserId);
            const currentRole = isMe ? role : rolesByUserId[String(utente.id)];
            const isAdmin = currentRole === 'admin';
            const isEditor = currentRole === 'editor';
            const isRemoved = currentRole === 'removed' || currentRole === 'revoked';
            const initials = (utente.name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
            const roleLabel = isRemoved ? 'Accesso revocato' : isAdmin ? 'Proprietario' : isEditor ? 'Editor' : currentRole === 'viewer' ? 'Osservatore' : 'Partecipante';
            const RoleIcon = isAdmin ? LuShieldCheck : isEditor ? LuPencil : LuEye;
            return (
              <li key={utente.id} className={`scrivania-member ${isRemoved ? 'is-revoked' : ''}`}>
                <div className="scrivania-member-info">
                  <span className="scrivania-member-avatar" aria-hidden="true">
                    {utente.avatar_url ? <img src={utente.avatar_url} alt="" /> : initials}
                  </span>
                  <div className="scrivania-member-details">
                    <div className="scrivania-member-name" title={utente.name}>
                      <span>{utente.name}</span>
                      {isMe && <span className="scrivania-member-self">Tu</span>}
                    </div>
                    <span className={`scrivania-member-role ${isEditor || isAdmin ? 'can-edit' : ''}`}>
                      <RoleIcon size={12} aria-hidden="true" />{roleLabel}
                    </span>
                  </div>
                </div>

                {canManageMembers && !isMe && currentRole && !isAdmin && !isRemoved && (
                  <div className="scrivania-member-actions">
                    <button
                      type="button"
                      className={`scrivania-member-permission ${isEditor ? 'is-editor' : ''}`}
                      aria-pressed={isEditor}
                      aria-label={`${isEditor ? 'Togli' : 'Consenti'} modifica scrivania ${isEditor ? 'a' : 'per'} ${utente.name}`}
                      title={isEditor ? 'Può aggiungere, modificare e rimuovere carte' : 'Può solo osservare la scrivania'}
                      onClick={() => setMemberRole(utente.id, isEditor ? 'viewer' : 'editor')}
                    >
                      <LuPencil size={13} aria-hidden="true" />
                      {isEditor ? 'Modifica attiva' : 'Consenti modifica'}
                    </button>
                    <button
                      type="button"
                      className="scrivania-member-revoke"
                      aria-label={`Revoca accesso a ${utente.name}`}
                      onClick={() => revokeMember(utente.id)}
                    >Revoca</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <footer className="scrivania-members-footer">Uno spazio condiviso, in tempo reale.</footer>
    </section>
  );
};

export default SidebarUtenti;
