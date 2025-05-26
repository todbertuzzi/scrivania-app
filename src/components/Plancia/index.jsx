/**
 * Componente principale per la plancia della scrivania
 * Versione refactored che utilizza dndkit e componenti modulari
 */
import React, { useState, useCallback, useEffect } from 'react';
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import Carta from './Carta';
import PanZoomControls from './PanZoomControls';
import { usePlanciaControls } from '../../hooks/usePlanciaControls';
import { useSession } from '../../context/SessionContext';
import { carteMazzo } from '../BarraCarte';

/**
 * Componente principale per la plancia di gioco
 * @param {Object} props - Props del componente
 * @param {Array} props.carte - Array delle carte sulla plancia
 * @param {Function} props.onUpdatePosizione - Callback per aggiornare posizione carta
 * @param {Function} props.onRimuovi - Callback per rimuovere carta
 * @param {Function} props.onRuota - Callback per ruotare carta
 * @param {Function} props.onScala - Callback per scalare carta
 * @param {Function} props.onGiraCarta - Callback per girare carta
 * @param {Function} props.onPlanciaUpdate - Callback per aggiornare plancia (opzionale)
 */
const Plancia = ({
  carte,
  onUpdatePosizione,
  onRimuovi,
  onRuota,
  onScala,
  onGiraCarta,
  onPlanciaUpdate
}) => {
  // Stato per carta selezionata
  const [selectedCardId, setSelectedCardId] = useState(null);
  
  // Hook per i controlli plancia (pan e zoom)
  const {
    planciaZoom,
    planciaPosition,
    isPanning,
    planciaRef,
    handlePlanciaMouseDown,
    resetPlancia,
    setPlanciaData
  } = usePlanciaControls(onPlanciaUpdate);
  
  // Accesso al contesto della sessione
  const { haControllo } = useSession();
  
  // Configurazione sensori dndkit
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Attivazione solo con distanza minima (evita click accidentali)
      activationConstraint: { distance: 5 }
    }),
    useSensor(TouchSensor, {
      // Ritardo e tolleranza per dispositivi touch
      activationConstraint: { delay: 250, tolerance: 5 }
    })
  );

  // Callback per selezionare una carta
  const handleSelectCard = useCallback((cardId) => {
    if (!haControllo()) return;
    setSelectedCardId(prev => prev === cardId ? null : cardId);
  }, [haControllo]);

  // Gestisce fine drag
  const handleDragEnd = useCallback((event) => {
    const { active, delta } = event;
    
    if (active && active.id && haControllo()) {
      const carta = carte.find(c => c.id === active.id);
      if (carta) {
        onUpdatePosizione(
          active.id,
          carta.x + delta.x,
          carta.y + delta.y
        );
      }
    }
  }, [carte, onUpdatePosizione, haControllo]);

  // Deseleziona carte quando si clicca sulla plancia
  const handlePlanciaClick = useCallback((e) => {
    // Solo se il click è direttamente sulla plancia o sul contenitore di trasformazione
    if (
      e.target === planciaRef.current ||
      e.target.classList.contains('transform-container')
    ) {
      setSelectedCardId(null);
    }
  }, [planciaRef]);

  // Quando lo zoom cambia, deseleziona la carta
  useEffect(() => {
    setSelectedCardId(null);
  }, [planciaZoom]);

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={planciaRef}
        className="w-full h-full relative overflow-hidden border border-dashed border-gray-400 plancia-container"
        onClick={handlePlanciaClick}
        onMouseDown={handlePlanciaMouseDown}
        style={{
          cursor: isPanning ? 'grabbing' : 'grab',
        }}
      >
        {/* Contenitore trasformabile per pan e zoom */}
        <div
          className="absolute w-full h-full transform-container"
          style={{
            transform: `scale(${planciaZoom}) translate(${planciaPosition.x}px, ${planciaPosition.y}px)`,
            transformOrigin: '0 0',
            transition: 'transform 0.05s ease-out',
          }}
        >
          {/* Renderizza tutte le carte */}
          {carte.map((carta) => (
            <Carta
              key={carta.id}
              carta={carta}
              isSelected={selectedCardId === carta.id}
              onSelect={handleSelectCard}
              onUpdatePosizione={onUpdatePosizione}
              onRimuovi={onRimuovi}
              onRuota={onRuota}
              onScala={onScala}
              onGira={onGiraCarta}
              carteMazzo={carteMazzo}
              canDrag={haControllo()}
            />
          ))}
        </div>
        
        {/* Controlli per lo zoom */}
        <PanZoomControls
          zoom={planciaZoom}
          onZoomIn={(newZoom) => setPlanciaData({ x: planciaPosition.x, y: planciaPosition.y }, newZoom)}
          onZoomOut={(newZoom) => setPlanciaData({ x: planciaPosition.x, y: planciaPosition.y }, newZoom)}
          onReset={resetPlancia}
        />
      </div>
    </DndContext>
  );
};

export default Plancia;