/**
 * Custom hook per gestire la connessione Pusher
 */
import { useState, useEffect, useCallback } from 'react';
import pusherService from '../services/pusherService';
import { CONNECTION_STATUS } from '../utils/constants';

/**
 * Hook per gestire l'integrazione con Pusher
 * @param {Object} sessionData - Dati della sessione
 * @param {Object} callbacks - Callbacks per gli eventi Pusher
 * @returns {Object} Stato della connessione e funzioni per interagire con Pusher
 */
export const usePusher = (sessionData, callbacks = {}) => {
  // Stato della connessione
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATUS.DISCONNECTED);
  // Lista degli utenti online
  const [utentiOnline, setUtentiOnline] = useState([]);
  // Stato di inizializzazione
  const [isInitialized, setIsInitialized] = useState(false);

  // Callback per aggiornare gli utenti online quando un utente si unisce
  const handleMemberJoined = useCallback((memberInfo) => {
    setUtentiOnline(prev => [
      ...prev,
      {
        id: memberInfo.id,
        name: memberInfo.name || 'Utente sconosciuto',
        email: memberInfo.email
      }
    ]);
    
    if (callbacks.onMemberJoined) {
      callbacks.onMemberJoined(memberInfo);
    }
  }, [callbacks]);

  // Callback per aggiornare gli utenti online quando un utente lascia
  const handleMemberLeft = useCallback((memberInfo) => {
    setUtentiOnline(prev => 
      prev.filter(user => user.id !== memberInfo.id)
    );
    
    if (callbacks.onMemberLeft) {
      callbacks.onMemberLeft(memberInfo);
    }
  }, [callbacks]);

  // Inizializza la connessione Pusher
  useEffect(() => {
    if (!sessionData || !sessionData.sessionId || isInitialized) return;

    const init = async () => {
      try {
        // Inizializza il servizio Pusher
        const initialized = pusherService.initialize(sessionData, setConnectionStatus);
        if (!initialized) {
          console.error('Impossibile inizializzare Pusher');
          return;
        }

        // Connetti al canale con i callbacks
        const membersOnline = await pusherService.connect({
          ...callbacks,
          onMemberJoined: handleMemberJoined,
          onMemberLeft: handleMemberLeft
        });

        // Imposta gli utenti online iniziali
        setUtentiOnline(membersOnline);
        setIsInitialized(true);
      } catch (error) {
        console.error('Errore durante l\'inizializzazione di Pusher:', error);
        setConnectionStatus(CONNECTION_STATUS.ERROR);
      }
    };

    init();

    // Cleanup al momento dello smontaggio
    return () => {
      pusherService.disconnect();
    };
  }, [sessionData, callbacks, handleMemberJoined, handleMemberLeft, isInitialized]);

  // Funzioni per inviare eventi Pusher
  const pusherActions = {
    muoviCarta: (cartaId, x, y) => pusherService.triggerMuoviCarta(cartaId, x, y),
    ruotaCarta: (cartaId, angolo) => pusherService.triggerRuotaCarta(cartaId, angolo),
    scalaCarta: (cartaId, scala) => pusherService.triggerScalaCarta(cartaId, scala),
    aggiungiCarta: (carta) => pusherService.triggerAggiungiCarta(carta),
    rimuoviCarta: (cartaId) => pusherService.triggerRimuoviCarta(cartaId),
    giraCarta: (cartaId, isFront) => pusherService.triggerGiraCarta(cartaId, isFront),
    assegnaControllo: (utenteId, haControllo) => pusherService.triggerAssegnaControllo(utenteId, haControllo),
    spostaPlancia: (x, y, zoom) => pusherService.triggerSpostaPlancia(x, y, zoom)
  };

  return {
    connectionStatus,
    utentiOnline,
    isInitialized,
    pusherActions
  };
};

export default usePusher;