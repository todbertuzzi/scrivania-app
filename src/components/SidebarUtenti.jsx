import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { pusherService } from '../services/pusher';

const SidebarUtenti = ({ sessionId, permissions, role }) => {
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

    const offSucceeded = pusherService.subscribe('pusher:subscription_succeeded', (m) => {
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
    });

    const offAdded = pusherService.subscribe('pusher:member_added', (member) => {
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
  }, []);

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

  return (
    <div className="w-64 bg-white border-l border-gray-300 p-4 shadow-md h-full">
      <h2 className="text-lg font-semibold mb-2">Utenti online</h2>
      {!pusherService.isReady() ? (
        <div className="text-sm text-gray-500">
          Realtime non attivo (Pusher non connesso)
        </div>
      ) : (
        <div className="text-sm text-gray-500 mb-3">
          {members.length} connessi
        </div>
      )}

      {canManageMembers && (
        <div className="text-xs text-gray-500 mb-2">
          {isLoadingRoles ? 'Caricamento permessi…' : rolesError ? `Permessi: ${rolesError}` : 'Permessi pronti'}
        </div>
      )}

      <ul className="space-y-2">
        {members.map((utente) => {
          const isMe = myUserId && String(utente.id) === String(myUserId);
          const currentRole = rolesByUserId[String(utente.id)] || (isMe ? role : null);
          const isAdmin = currentRole === 'admin';
          const isEditor = currentRole === 'editor';
          const isRemoved = currentRole === 'removed' || currentRole === 'revoked';
          return (
            <li key={utente.id} className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2 min-w-0">
              {utente.avatar_url ? (
                <img
                  src={utente.avatar_url}
                  alt={utente.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200" />
              )}
              <div className="flex flex-col min-w-0">
                <span className="truncate">{utente.name}</span>
                {isMe && <span className="text-xs text-blue-600">tu</span>}
                {currentRole && !isMe && (
                  <span className={`text-xs ${isRemoved ? 'text-red-600' : 'text-gray-500'}`}>
                    {isRemoved ? 'revocato' : currentRole}
                  </span>
                )}
              </div>
              </div>

              {canManageMembers && !isMe && !isAdmin && (
                <div className="flex items-center gap-2">
                  {!isRemoved && (
                    <button
                      className={`text-xs px-2 py-1 rounded border ${
                        isEditor ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700'
                      }`}
                      onClick={() => setMemberRole(utente.id, isEditor ? 'viewer' : 'editor')}
                    >
                      {isEditor ? 'Editor ✓' : 'Viewer'}
                    </button>
                  )}

                  <button
                    className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 bg-red-50"
                    onClick={() => revokeMember(utente.id)}
                  >
                    Revoca
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SidebarUtenti;
