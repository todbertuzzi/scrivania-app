/**
 * Custom hook per configurare i sensori di dnd-kit
 */
import { useSensors, useSensor, MouseSensor, TouchSensor, KeyboardSensor } from '@dnd-kit/core';

/**
 * Hook per configurare i sensori ottimali per il drag and drop
 * @param {Object} options - Opzioni per la configurazione dei sensori
 * @param {number} options.activationDistance - Distanza minima per attivare il drag (default: 5)
 * @param {number} options.touchDelay - Ritardo per dispositivi touch (default: 250)
 * @param {number} options.touchTolerance - Tolleranza per dispositivi touch (default: 5)
 * @returns {Object} Sensori configurati per dnd-kit
 */
export const useDragDropSensors = (options = {}) => {
  const {
    activationDistance = 5,
    touchDelay = 250,
    touchTolerance = 5
  } = options;

  const sensors = useSensors(
    // Sensore mouse con distanza di attivazione per evitare drag accidentali
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: activationDistance,
      },
    }),
    
    // Sensore touch con ritardo e tolleranza per dispositivi mobili
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: touchDelay,
        tolerance: touchTolerance,
      },
    }),
    
    // Sensore tastiera per accessibilità
    useSensor(KeyboardSensor)
  );

  return { sensors };
};

export default useDragDropSensors;