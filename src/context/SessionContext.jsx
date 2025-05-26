/**
 * Context per condividere i dati della sessione tra i componenti
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import apiService from '../services/apiService';
import { CONNECTION_STATUS } from '../utils/constants';

// Creazione del context
const SessionContext = createContext();

/**
 * Provider per il context della sessione
 * @param {Object} props - Props con i children
 */
export const SessionProvider = ({ children }) => {
  // Stato per i dati della sessione
  const [sessionData, setSessionData] = useState(null);
  // Stato di caricamento
  const [loading, setLoading] = useState(true);
  // Stato di errore
  const [error, setError] = useState(null);
  // Stato del controllo (chi ha il controllo della plancia)
  const [controlloUtente, setControlloUtente] = useState(null);

  // Carica i dati della sessione all'avvio
  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Carica i dati della sessione dall'API
        const data = await apiService.loadSessionData();
        
        // Imposta il controllo iniziale (admin ha il controllo di default)
        if (data.isAdmin && !controlloUtente) {
          setControlloUtente(data.userId);
        }
        
        setSessionData(data);
      } catch (err) {
        console.error('Errore nel caricamento della sessione:', err);
        setError(err.message || 'Errore nel caricamento della sessione');
      } finally {
        setLoading(false);
      }
    };
    
    loadSession();
  }, [controlloUtente]);

  /**
   * Salva lo stato della sessione sul server
   * @param {Object} sessione - Configurazione della sessione
   * @param {Array} carte - Array delle carte
   */
  const saveSession = async (sessione, carte) => {
    if (!sessionData || !sessionData.sessionId) return false;
    
    try {
      const result = await apiService.saveSessionData(
        sessionData.sessionId, 
        sessione, 
        carte
      );
      
      return result.success;
    } catch (err) {
      console.error('Errore nel salvataggio della sessione:', err);
      return false;
    }
  };

  /**
   * Cambia l'utente che ha il controllo della plancia
   * @param {string} utenteId - ID dell'utente
   */
  const cambiaControllo = (utenteId) => {
    setControlloUtente(utenteId);
  };

  /**
   * Verifica se l'utente corrente ha il controllo
   * @returns {boolean} True se l'utente ha il controllo
   */
  const haControllo = () => {
    if (!sessionData) return false;
    
    // L'admin ha sempre il controllo
    if (sessionData.isAdmin) return true;
    
    // Altrimenti verifica se l'utente è quello con il controllo
    return controlloUtente === sessionData.userId;
  };

  // Valori forniti dal context
  const value = {
    sessionData,
    loading,
    error,
    controlloUtente,
    cambiaControllo,
    haControllo,
    saveSession,
    isAdmin: sessionData?.isAdmin || false
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

/**
 * Hook per utilizzare il context della sessione
 * @returns {Object} Valori del context
 */
export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession deve essere usato all\'interno di un SessionProvider');
  }
  return context;
};

export default SessionContext;