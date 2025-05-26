/**
 * Custom hook per la gestione del drag and drop utilizzando dndkit
 */
import { useState, useCallback, useMemo } from 'react';
import { 
  DndContext, 
  useSensor, 
  useSensors,
  PointerSensor, 
  MouseSensor,
  TouchSensor,
  useDraggable
} from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';

/**
 * Hook per gestire il drag and drop delle carte sulla plancia
 * @param {Function} onUpdatePosizione - Callback chiamata quando la posizione di una carta cambia
 * @returns {Object} Oggetti e funzioni per il drag and drop
 */
export const useDragDrop = (onUpdatePosizione) => {
  // Stato per tracciare quale elemento è attualmente in fase di trascinamento
  const [activeId, setActiveId] = useState(null);
  
  // Sensori per il drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Aumenta la distanza di attivazione per evitare drag accidentali
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(MouseSensor, {
      // Attiva solo con il click sinistro
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      // Ritardo per dispositivi touch per differenziare tra tap e drag
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Quando inizia il drag
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setActiveId(active.id);
  }, []);

  // Durante il drag
  const handleDragMove = useCallback((event) => {
    // Potrebbe essere utile per animazioni o feedback durante il drag
  }, []);

  // Quando termina il drag
  const handleDragEnd = useCallback((event) => {
    const { active, delta, over } = event;
    
    if (active && active.id) {
      // Chiamiamo la callback con l'id della carta e la nuova posizione
      onUpdatePosizione(active.id, delta.x, delta.y);
    }
    
    setActiveId(null);
  }, [onUpdatePosizione]);

  // Modificatori per limitare il movimento all'interno della plancia
  const modifiers = useMemo(() => [
    restrictToParentElement
  ], []);

  // Restituisci tutto ciò che serve per configurare dndkit
  return {
    sensors,
    activeId,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    modifiers,
    DndContext,
    useDraggable
  };
};

export default useDragDrop;