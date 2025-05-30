import { useState, useEffect, useCallback } from 'react';
import { pusherService } from '../services/pusher';

export const useSharedState = () => {
  const [sessionData, setSessionData] = useState({
    carte: [],
    planciaZoom: 1,
    planciaPosition: { x: 0, y: 0 },
  });
  
  const [userRole, setUserRole] = useState('viewer'); // 'creator' o 'viewer'
  const [sessionId, setSessionId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inizializzazione
  useEffect(() => {
    const initializeSession = async () => {
      const container = document.querySelector('#root');
      const token = container?.dataset?.token;
      const userId = container?.dataset?.userId;
      const sessionIdFromData = container?.dataset?.sessionId;

      if (!token && !isLocalEnvironment()) {
        console.error('Token mancante');
        return;
      }

      setSessionId(sessionIdFromData);
      
      // Determina il ruolo utente
      const role = await fetchUserRole(token, userId);
      setUserRole(role);

      // Inizializza Pusher
      await pusherService.init(sessionIdFromData, role);

      // Carica stato iniziale
      const initialState = await loadInitialState(sessionIdFromData, token);
      setSessionData(initialState);

      // Setup listeners
      setupPusherListeners();
      
      setIsInitialized(true);
    };

    initializeSession();

    return () => {
      pusherService.disconnect();
    };
  }, []);

  const isLocalEnvironment = () => {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  };

  const fetchUserRole = async (token, userId) => {
    if (isLocalEnvironment()) {
      return 'creator'; // In locale, sempre creator per testare
    }

    try {
      const response = await fetch('/wp-json/scrivania/v1/user-role', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      return data.role || 'viewer';
    } catch (error) {
      console.error('Errore fetch ruolo utente:', error);
      return 'viewer';
    }
  };

  const loadInitialState = async (sessionId, token) => {
    if (isLocalEnvironment()) {
      return {
        carte: [],
        planciaZoom: 1,
        planciaPosition: { x: 0, y: 0 },
      };
    }

    try {
      const response = await fetch(`/wp-json/scrivania/v1/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Errore caricamento stato:', error);
      return {
        carte: [],
        planciaZoom: 1,
        planciaPosition: { x: 0, y: 0 },
      };
    }
  };

  const setupPusherListeners = () => {
    pusherService.subscribe('cards-updated', (data) => {
      setSessionData(prev => ({ ...prev, carte: data.carte }));
    });

    pusherService.subscribe('plancia-updated', (data) => {
      setSessionData(prev => ({
        ...prev,
        planciaZoom: data.zoom,
        planciaPosition: data.position
      }));
    });

    pusherService.subscribe('card-moved', (data) => {
      setSessionData(prev => ({
        ...prev,
        carte: prev.carte.map(carta => 
          carta.id === data.cardId 
            ? { ...carta, x: data.x, y: data.y }
            : carta
        )
      }));
    });

    pusherService.subscribe('card-rotated', (data) => {
      setSessionData(prev => ({
        ...prev,
        carte: prev.carte.map(carta => 
          carta.id === data.cardId 
            ? { ...carta, angle: data.angle }
            : carta
        )
      }));
    });

    pusherService.subscribe('card-scaled', (data) => {
      setSessionData(prev => ({
        ...prev,
        carte: prev.carte.map(carta => 
          carta.id === data.cardId 
            ? { ...carta, scale: data.scale }
            : carta
        )
      }));
    });
  };

  // Funzioni per aggiornare lo stato (solo per creator)
  const updateCards = useCallback(async (carte) => {
    if (userRole !== 'creator') return;

    setSessionData(prev => ({ ...prev, carte }));
    
    await pusherService.trigger('cards-updated', { carte });
    
    // Salva su WordPress
    if (!isLocalEnvironment()) {
      await saveToWordPress('cards', { carte });
    }
  }, [userRole]);

  const updatePlancia = useCallback(async (zoom, position) => {
    if (userRole !== 'creator') return;

    setSessionData(prev => ({
      ...prev,
      planciaZoom: zoom,
      planciaPosition: position
    }));
    
    await pusherService.trigger('plancia-updated', { zoom, position });
    
    if (!isLocalEnvironment()) {
      await saveToWordPress('plancia', { zoom, position });
    }
  }, [userRole]);

  const moveCard = useCallback(async (cardId, x, y) => {
    if (userRole !== 'creator') return;

    setSessionData(prev => ({
      ...prev,
      carte: prev.carte.map(carta => 
        carta.id === cardId ? { ...carta, x, y } : carta
      )
    }));
    
    await pusherService.trigger('card-moved', { cardId, x, y });
    
    if (!isLocalEnvironment()) {
      await saveToWordPress('card-position', { cardId, x, y });
    }
  }, [userRole]);

  const rotateCard = useCallback(async (cardId, angle) => {
    if (userRole !== 'creator') return;

    setSessionData(prev => ({
      ...prev,
      carte: prev.carte.map(carta => 
        carta.id === cardId ? { ...carta, angle } : carta
      )
    }));
    
    await pusherService.trigger('card-rotated', { cardId, angle });
    
    if (!isLocalEnvironment()) {
      await saveToWordPress('card-rotation', { cardId, angle });
    }
  }, [userRole]);

  const scaleCard = useCallback(async (cardId, scale) => {
    if (userRole !== 'creator') return;

    setSessionData(prev => ({
      ...prev,
      carte: prev.carte.map(carta => 
        carta.id === cardId ? { ...carta, scale } : carta
      )
    }));
    
    await pusherService.trigger('card-scaled', { cardId, scale });
    
    if (!isLocalEnvironment()) {
      await saveToWordPress('card-scale', { cardId, scale });
    }
  }, [userRole]);

  const saveToWordPress = async (type, data) => {
    try {
      await fetch('/wp-json/scrivania/v1/save-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pusherService.getToken()}`
        },
        body: JSON.stringify({
          sessionId,
          type,
          data
        })
      });
    } catch (error) {
      console.error('Errore salvataggio su WordPress:', error);
    }
  };

  return {
    sessionData,
    userRole,
    isInitialized,
    updateCards,
    updatePlancia,
    moveCard,
    rotateCard,
    scaleCard,
  };
};