/**
 * Componente per la visualizzazione di una singola carta sulla plancia
 */
import React, { useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import { Card } from '../ui/Card';
import ControlliCarta from './ControlliCarta';
import { getCardFrontImagePath } from '../../utils/paths';

/**
 * Componente per una carta sulla plancia
 * @param {Object} props - Props del componente
 * @param {Object} props.carta - Dati della carta
 * @param {boolean} props.isSelected - Se la carta è selezionata
 * @param {Function} props.onSelect - Callback per la selezione
 * @param {Function} props.onUpdatePosizione - Callback per l'aggiornamento della posizione
 * @param {Function} props.onRimuovi - Callback per la rimozione
 * @param {Function} props.onRuota - Callback per la rotazione
 * @param {Function} props.onScala - Callback per la scala
 * @param {Function} props.onGira - Callback per girare la carta
 * @param {Array} props.carteMazzo - Array delle carte nel mazzo
 * @param {boolean} props.canDrag - Se la carta può essere trascinata
 */
const Carta = ({
  carta,
  isSelected,
  onSelect,
  onUpdatePosizione,
  onRimuovi,
  onRuota,
  onScala,
  onGira,
  carteMazzo,
  canDrag = true
}) => {
  // Riferimento all'elemento carta per calcoli geometrici
  const cardRef = useRef(null);
  
  // Configurazione dndkit per drag & drop
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: carta.id,
    disabled: !canDrag
  });
  
  // Calcola lo stile di trasformazione basato sulla rotazione e scala della carta
  const cardTransformStyle = {
    transform: `rotate(${carta.angle || 0}deg) scale(${carta.scale || 1.0})`,
    transformOrigin: "center center",
    cursor: canDrag ? "pointer" : "default"
  };
  
  // Ottieni il percorso corretto dell'immagine frontale
  const frontImagePath = carta.frontImg || getCardFrontImagePath();
  
  // Gestisce il click sulla carta
  const handleCardClick = (e) => {
    e.stopPropagation();
    onSelect(carta.id);
  };
  
  return (
    <motion.div
      className="absolute"
      style={{
        position: "absolute",
        left: carta.x,
        top: carta.y,
        zIndex: isSelected ? 10 : 1,
        // Applica la trasformazione del drag se presente
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
      ref={setNodeRef}
      {...(canDrag ? { ...attributes, ...listeners } : {})}
      onPointerDown={handleCardClick}
    >
      {/* Contenitore che ruota e scala */}
      <div
        ref={cardRef}
        style={cardTransformStyle}
        className="relative"
      >
        {/* Controlli visibili solo se la carta è selezionata */}
        {isSelected && (
          <ControlliCarta
            carta={carta}
            onRimuovi={() => onRimuovi(carta.id)}
            onRuota={(angolo) => onRuota(carta.id, angolo)}
            onScala={(scala) => onScala(carta.id, scala)}
            onGira={() => onGira(carta.id, carteMazzo)}
            cardRef={cardRef}
          />
        )}

        {/* La carta stessa */}
        <Card
          className={`w-auto h-[150px] p-[10px] bg-white overflow-hidden ${
            isSelected
              ? "ring-4 ring-blue-400 shadow-xl"
              : "shadow-lg"
          }`}
        >
          {/* Mostra l'immagine appropriata in base a isFront */}
          {carta.isFront ? (
            // Mostra il fronte (comune a tutte le carte)
            <img
              src={frontImagePath}
              alt="Fronte carta"
              className="w-full h-full object-cover rounded pointer-events-none"
            />
          ) : (
            // Mostra il retro (specifico per questa carta)
            <img
              src={carta.retro || carta.img}
              alt="Retro carta"
              className="w-full h-full object-cover rounded pointer-events-none"
            />
          )}
        </Card>
      </div>
    </motion.div>
  );
};

// Ottimizzazione: rirendering solo quando necessario
export default memo(Carta, (prevProps, nextProps) => {
  return (
    prevProps.carta.id === nextProps.carta.id &&
    prevProps.carta.x === nextProps.carta.x &&
    prevProps.carta.y === nextProps.carta.y &&
    prevProps.carta.angle === nextProps.carta.angle &&
    prevProps.carta.scale === nextProps.carta.scale &&
    prevProps.carta.isFront === nextProps.carta.isFront &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.canDrag === nextProps.canDrag
  );
});