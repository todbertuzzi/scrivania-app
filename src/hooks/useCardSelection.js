/**
 * Custom hook per gestire la selezione delle carte
 */
import { useState, useCallback } from 'react';

/**
 * Hook per gestire la selezione delle carte sulla plancia
 * @param {Function} canSelect - Funzione che determina se è possibile selezionare
 * @returns {Object} Stato e funzioni per la selezione delle carte
 */
export const useCardSelection = (canSelect) => {
  // Stato per carta selezionata
  const [selectedCardId, setSelectedCardId] = useState(null);

  /**
   * Gestisce la selezione di una carta
   * @param {string} cardId - ID della carta da selezionare
   */
  const handleSelectCard = useCallback((cardId) => {
    if (!canSelect || (typeof canSelect === 'function' && !canSelect())) {
      return;
    }
    
    setSelectedCardId(prev => {
      // Se la carta è già selezionata, deselezionala
      if (prev === cardId) {
        return null;
      }
      // Altrimenti seleziona la nuova carta
      return cardId;
    });
  }, [canSelect]);

  /**
   * Deseleziona tutte le carte
   */
  const clearSelection = useCallback(() => {
    setSelectedCardId(null);
  }, []);

  /**
   * Verifica se una carta è selezionata
   * @param {string} cardId - ID della carta da verificare
   * @returns {boolean} True se la carta è selezionata
   */
  const isCardSelected = useCallback((cardId) => {
    return selectedCardId === cardId;
  }, [selectedCardId]);

  /**
   * Seleziona una carta specifica (forza la selezione)
   * @param {string} cardId - ID della carta da selezionare
   */
  const selectCard = useCallback((cardId) => {
    if (!canSelect || (typeof canSelect === 'function' && !canSelect())) {
      return;
    }
    setSelectedCardId(cardId);
  }, [canSelect]);

  return {
    selectedCardId,
    handleSelectCard,
    clearSelection,
    isCardSelected,
    selectCard,
    hasSelection: selectedCardId !== null
  };
};

export default useCardSelection;