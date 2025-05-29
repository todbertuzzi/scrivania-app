// src/hooks/useSyncWithPusher.js
import { useEffect, useCallback } from 'react';
import { usePusher } from './usePusher';

export const useSyncWithPusher = (sessionData, cardsManager, planciaControls) => {
  const pusherCallbacks = {
    onCartaMossa: useCallback((cartaId, x, y) => {
      cardsManager.aggiornaDaServer({ id: cartaId, x, y });
    }, [cardsManager]),
    
    onCartaRotata: useCallback((cartaId, angolo) => {
      cardsManager.aggiornaDaServer({ id: cartaId, angle: angolo });
    }, [cardsManager]),
    
    onCartaScalata: useCallback((cartaId, scala) => {
      cardsManager.aggiornaDaServer({ id: cartaId, scale: scala });
    }, [cardsManager]),
    
    onCartaAggiunta: useCallback((carta) => {
      cardsManager.aggiornaDaServer(carta);
    }, [cardsManager]),
    
    onCartaRimossa: useCallback((cartaId) => {
      cardsManager.rimuoviDaServer(cartaId);
    }, [cardsManager]),
    
    onCartaGirata: useCallback((cartaId, isFront) => {
      const carta = cardsManager.carte.find(c => c.id === cartaId);
      if (carta) {
        cardsManager.aggiornaDaServer({ ...carta, isFront });
      }
    }, [cardsManager]),
    
    onPlanciaSpostata: useCallback((x, y, zoom) => {
      planciaControls.setPlanciaData({ x, y }, zoom);
    }, [planciaControls])
  };
  
  const { connectionStatus, utentiOnline, pusherActions } = usePusher(
    sessionData,
    pusherCallbacks
  );
  
  return { connectionStatus, utentiOnline, pusherActions };
};