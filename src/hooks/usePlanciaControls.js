/**
 * Custom hook per gestire i controlli della plancia (pan e zoom)
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { PLANCIA_CONFIG } from '../utils/constants';

/**
 * Hook per gestire pan e zoom della plancia
 * @param {Function} onUpdate - Callback per notificare aggiornamenti (opzionale)
 * @returns {Object} Stato e funzioni per controllare la plancia
 */
export const usePlanciaControls = (onUpdate) => {
  // Stato per lo zoom
  const [planciaZoom, setPlanciaZoom] = useState(PLANCIA_CONFIG.DEFAULT_ZOOM);
  // Stato per la posizione
  const [planciaPosition, setPlanciaPosition] = useState({ x: 0, y: 0 });
  // Stato per il panning attivo
  const [isPanning, setIsPanning] = useState(false);
  
  // Riferimenti per il pan
  const panStartPosition = useRef({ x: 0, y: 0 });
  const panStartMousePosition = useRef({ x: 0, y: 0 });
  
  // Riferimento all'elemento della plancia
  const planciaRef = useRef(null);

  /**
   * Inizia il panning della plancia
   * @param {MouseEvent} e - Evento del mouse
   */
  const handlePlanciaMouseDown = useCallback((e) => {
    if (!planciaRef.current) return;
    
    // Verifichiamo se il click è sulla plancia o sul contenitore di trasformazione
    const isOnPlancia = e.currentTarget === planciaRef.current && e.target === e.currentTarget;
    const isOnTransformContainer = e.target.classList.contains('transform-container');
    
    if (isOnPlancia || isOnTransformContainer) {
      e.stopPropagation();
      setIsPanning(true);
      panStartPosition.current = { ...planciaPosition };
      panStartMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  }, [planciaPosition]);

  /**
   * Gestisce il movimento durante il panning
   * @param {MouseEvent} e - Evento del mouse
   */
  const handlePlanciaMouseMove = useCallback((e) => {
    if (isPanning) {
      const deltaX = e.clientX - panStartMousePosition.current.x;
      const deltaY = e.clientY - panStartMousePosition.current.y;
      
      // Assicuriamoci che il movimento sia abbastanza significativo
      // per evitare piccoli movimenti accidentali
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        const newPosition = {
          x: panStartPosition.current.x + deltaX,
          y: panStartPosition.current.y + deltaY
        };
        
        setPlanciaPosition(newPosition);
        
        // Notifica l'aggiornamento se c'è una callback
        if (onUpdate) {
          onUpdate('position', newPosition, planciaZoom);
        }
      }
    }
  }, [isPanning, planciaZoom, onUpdate]);

  /**
   * Termina il panning della plancia
   */
  const handleGlobalMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
  }, [isPanning]);

  /**
   * Gestisce lo zoom con la rotella del mouse
   * @param {WheelEvent} e - Evento della rotella
   */
  const handlePlanciaWheel = useCallback((e) => {
    // Determina la direzione dello zoom (positivo = zoom out, negativo = zoom in)
    const delta = e.deltaY > 0 ? -PLANCIA_CONFIG.ZOOM_STEP : PLANCIA_CONFIG.ZOOM_STEP;
    
    // Calcola il nuovo fattore di zoom, mantenendolo entro limiti ragionevoli
    const newZoom = Math.max(
      PLANCIA_CONFIG.MIN_ZOOM, 
      Math.min(PLANCIA_CONFIG.MAX_ZOOM, planciaZoom + delta)
    );
    
    if (planciaRef.current) {
      // Calcola il punto di riferimento per lo zoom (posizione del mouse)
      const rect = planciaRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calcola la nuova posizione mantenendo il punto sotto il mouse invariato
      const scale = newZoom / planciaZoom;
      const newX = mouseX - (mouseX - planciaPosition.x) * scale;
      const newY = mouseY - (mouseY - planciaPosition.y) * scale;
      
      const newPosition = { x: newX, y: newY };
      
      setPlanciaZoom(newZoom);
      setPlanciaPosition(newPosition);
      
      // Notifica l'aggiornamento se c'è una callback
      if (onUpdate) {
        onUpdate('zoom', newPosition, newZoom);
      }
    }
  }, [planciaZoom, planciaPosition, onUpdate]);

  /**
   * Resetta la plancia alla posizione e zoom iniziali
   */
  const resetPlancia = useCallback(() => {
    setPlanciaZoom(PLANCIA_CONFIG.DEFAULT_ZOOM);
    setPlanciaPosition({ x: 0, y: 0 });
    
    // Notifica l'aggiornamento se c'è una callback
    if (onUpdate) {
      onUpdate('reset', { x: 0, y: 0 }, PLANCIA_CONFIG.DEFAULT_ZOOM);
    }
  }, [onUpdate]);

  /**
   * Imposta i dati della plancia (usato per sincronizzazione)
   * @param {Object} position - Nuova posizione
   * @param {number} zoom - Nuovo zoom
   */
  const setPlanciaData = useCallback((position, zoom) => {
    if (position) setPlanciaPosition(position);
    if (zoom) setPlanciaZoom(zoom);
  }, []);

  // Effetto per aggiungere/rimuovere gli event listener globali
  useEffect(() => {
    // Configurazione del wheel event con opzione passive: false per consentire preventDefault
    const wheelHandler = (e) => {
      // Solo se l'evento avviene sulla plancia o sul contenitore di trasformazione
      if (!planciaRef.current) return;
      
      const isOnPlancia = planciaRef.current.contains(e.target);
      const isOnTransformContainer = e.target.classList && e.target.classList.contains('transform-container');
      
      if (isOnPlancia || isOnTransformContainer) {
        e.preventDefault(); // Necessario per prevenire lo scrolling della pagina
        handlePlanciaWheel(e);
      }
    };
    
    // Usiamo l'opzione { passive: false } per consentire preventDefault sugli eventi wheel
    window.addEventListener('wheel', wheelHandler, { passive: false });
    
    // Event listener per il movimento del mouse durante il panning
    window.addEventListener('mousemove', handlePlanciaMouseMove);
    
    // Event listener per il rilascio del mouse
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    // Cleanup degli event listener
    return () => {
      window.removeEventListener('wheel', wheelHandler, { passive: false });
      window.removeEventListener('mousemove', handlePlanciaMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handlePlanciaMouseMove, handleGlobalMouseUp, handlePlanciaWheel]);

  return {
    planciaZoom,
    planciaPosition,
    isPanning,
    planciaRef,
    handlePlanciaMouseDown,
    resetPlancia,
    setPlanciaData
  };
};

export default usePlanciaControls;