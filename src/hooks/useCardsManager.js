/**
 * Custom hook per la gestione delle carte
 * Centralizza tutta la logica di manipolazione delle carte
 */
import { useState, useCallback } from 'react';
import { CARTA_CONFIG } from '../utils/constants';

/**
 * Hook per gestire tutte le operazioni sulle carte
 * @param {Function} onUpdateServer - Opzionale: callback per sincronizzare le modifiche col server
 * @returns {Object} Funzioni e stato per la gestione delle carte
 */
export const useCardsManager = (onUpdateServer) => {
  // Stato delle carte
  const [carte, setCarte] = useState([]);

  /**
   * Aggiunge una nuova carta alla plancia
   * @param {Object} carta - Dati della carta da aggiungere
   */
  const aggiungiCarta = useCallback((carta) => {
    // Prepara la nuova carta con tutte le proprietà necessarie
    const nuovaCarta = {
      ...carta,
      id: `${carta.id}-${Date.now()}`,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      angle: CARTA_CONFIG.DEFAULT_ANGLE,
      scale: CARTA_CONFIG.DEFAULT_SCALE,
      isFront: true, // Inizialmente mostra il fronte
      retro: null,   // L'immagine del retro verrà assegnata quando la carta viene girata
    };
    
    setCarte((prev) => {
      const newCards = [...prev, nuovaCarta];
      
      // Notifica il server se la callback è fornita
      if (onUpdateServer) {
        onUpdateServer('aggiungi', nuovaCarta);
      }
      
      return newCards;
    });
  }, [onUpdateServer]);

  /**
   * Aggiorna la posizione di una carta
   * @param {string} id - ID della carta
   * @param {number} x - Nuova posizione X
   * @param {number} y - Nuova posizione Y
   */
  const aggiornaPosizione = useCallback((id, x, y) => {
    setCarte((prev) => {
      const newCards = prev.map((c) => (c.id === id ? { ...c, x, y } : c));
      
      // Notifica il server
      if (onUpdateServer) {
        const updatedCard = newCards.find(c => c.id === id);
        if (updatedCard) {
          onUpdateServer('posizione', updatedCard);
        }
      }
      
      return newCards;
    });
  }, [onUpdateServer]);

  /**
   * Rimuove una carta dalla plancia
   * @param {string} id - ID della carta da rimuovere
   */
  const rimuoviCarta = useCallback((id) => {
    setCarte((prev) => {
      const cardToRemove = prev.find(c => c.id === id);
      const newCards = prev.filter((c) => c.id !== id);
      
      // Notifica il server
      if (onUpdateServer && cardToRemove) {
        onUpdateServer('rimuovi', cardToRemove);
      }
      
      return newCards;
    });
  }, [onUpdateServer]);

  /**
   * Aggiorna l'angolo di rotazione di una carta
   * @param {string} id - ID della carta
   * @param {number} nuovoAngolo - Nuovo angolo di rotazione
   */
  const aggiornaAngolo = useCallback((id, nuovoAngolo) => {
    // Normalizza l'angolo per mantenerlo tra 0 e 360
    const normalizzato = ((nuovoAngolo % 360) + 360) % 360;

    setCarte((prev) => {
      const carta = prev.find((c) => c.id === id);
      
      // Se l'angolo è identico o molto simile, non aggiornare lo stato
      if (carta && Math.abs(carta.angle - normalizzato) < 0.1) {
        return prev;
      }

      const newCards = prev.map((c) => (c.id === id ? { ...c, angle: normalizzato } : c));
      
      // Notifica il server
      if (onUpdateServer) {
        const updatedCard = newCards.find(c => c.id === id);
        if (updatedCard) {
          onUpdateServer('rotazione', updatedCard);
        }
      }
      
      return newCards;
    });
  }, [onUpdateServer]);

  /**
   * Aggiorna la scala di una carta
   * @param {string} id - ID della carta
   * @param {number} nuovaScala - Nuovo fattore di scala
   */
  const aggiornaScala = useCallback((id, nuovaScala) => {
    // Limita la scala a un intervallo ragionevole
    const scalaLimitata = Math.min(
      Math.max(nuovaScala, CARTA_CONFIG.MIN_SCALE), 
      CARTA_CONFIG.MAX_SCALE
    );

    setCarte((prev) => {
      const newCards = prev.map((c) => (c.id === id ? { ...c, scale: scalaLimitata } : c));
      
      // Notifica il server
      if (onUpdateServer) {
        const updatedCard = newCards.find(c => c.id === id);
        if (updatedCard) {
          onUpdateServer('scala', updatedCard);
        }
      }
      
      return newCards;
    });
  }, [onUpdateServer]);

  /**
   * Gira una carta (fronte/retro)
   * @param {string} id - ID della carta
   * @param {Array} carteMazzo - Elenco delle carte disponibili per selezionare il retro
   */
  const giraCarta = useCallback((id, carteMazzo) => {
    setCarte((prev) => {
      // Trova la carta da girare
      const carta = prev.find((c) => c.id === id);
      if (!carta) return prev;

      let newCards;
      
      // Verifica se è la prima volta che giriamo questa carta
      if (carta.isFront && carta.retro === null) {
        // Prima volta che viene girata: scegli un'immagine casuale dal mazzo
        const carteDisponibili = carteMazzo.filter((c) => c.id !== carta.id);
        const cartaRandom = carteDisponibili[Math.floor(Math.random() * carteDisponibili.length)];

        // Aggiorna la carta con il nuovo retro e cambia isFront
        newCards = prev.map((c) =>
          c.id === id ? { ...c, isFront: !c.isFront, retro: cartaRandom.img } : c
        );
      } else {
        // Carta già girata in precedenza, mantieni lo stesso retro ma cambia isFront
        newCards = prev.map((c) => c.id === id ? { ...c, isFront: !c.isFront } : c);
      }
      
      // Notifica il server
      if (onUpdateServer) {
        const updatedCard = newCards.find(c => c.id === id);
        if (updatedCard) {
          onUpdateServer('gira', updatedCard);
        }
      }
      
      return newCards;
    });
  }, [onUpdateServer]);

  /**
   * Aggiorna una carta dal server (quando un altro utente la modifica)
   * @param {Object} cartaAggiornata - Dati aggiornati della carta
   */
  const aggiornaDaServer = useCallback((cartaAggiornata) => {
    setCarte((prev) => {
      // Se la carta non esiste, la aggiungiamo
      if (!prev.some(c => c.id === cartaAggiornata.id)) {
        return [...prev, cartaAggiornata];
      }
      
      // Altrimenti aggiorniamo quella esistente
      return prev.map(c => c.id === cartaAggiornata.id ? cartaAggiornata : c);
    });
  }, []);

  /**
   * Rimuove una carta in base a notifica dal server
   * @param {string} cartaId - ID della carta da rimuovere
   */
  const rimuoviDaServer = useCallback((cartaId) => {
    setCarte(prev => prev.filter(c => c.id !== cartaId));
  }, []);

  // Restituisce tutte le funzioni e lo stato
  return {
    carte,
    setCarte,
    aggiungiCarta,
    aggiornaPosizione,
    rimuoviCarta,
    aggiornaAngolo,
    aggiornaScala,
    giraCarta,
    aggiornaDaServer,
    rimuoviDaServer
  };
};

export default useCardsManager;