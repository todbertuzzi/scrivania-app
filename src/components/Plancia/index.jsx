/**
 * Componente principale per la plancia della scrivania
 * Versione refactored con migliore separazione delle responsabilità
 */
import React, { useState, useCallback, useEffect } from 'react';
import { DndContext } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';

// Componenti
import Carta from './Carta';
import PanZoomControls from './PanZoomControls';
import PlanciaBackground from './PlanciaBackground';

// Hooks personalizzati
import { usePlanciaControls } from '../../hooks/usePlanciaControls';
import { useDragDropSensors } from '../../hooks/useDragDropSensors';
import { useCardSelection } from '../../hooks/useCardSelection';

// Context
import { useSession } from '../../context/SessionContext';

// Dati
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
  // Hooks personalizzati per le diverse funzionalità
  const { haControllo } = useSession();
  const { selectedCardId, handleSelectCard, clearSelection } = useCardSelection(haControllo);
  const { sensors } = useDragDropSensors();
  const {
    planciaZoom,
    planciaPosition,
    isPanning,
    planciaRef,
    handlePlanciaMouseDown,
    resetPlancia,
    setPlanciaData
  } = usePlanciaControls(onPlanciaUpdate);

  // Gestisce fine drag
  const handleDragEnd = useCallback((event) => {
    const { active, delta } = event;
    
    if (active?.id && haControllo()) {
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

  // Gestisce il click sulla plancia per deselezionare le carte
  const handlePlanciaClick = useCallback((e) => {
    // Solo se il click è direttamente sulla plancia o sul contenitore di trasformazione
    if (
      e.target === planciaRef.current ||
      e.target.classList.contains('transform-container') ||
      e.target.classList.contains('plancia-background')
    ) {
      clearSelection();
    }
  }, [planciaRef, clearSelection]);

  // Deseleziona carte quando lo zoom cambia
  useEffect(() => {
    clearSelection();
  }, [planciaZoom, clearSelection]);

  // Handlers per i controlli zoom
  const handleZoomIn = useCallback((newZoom) => {
    setPlanciaData(planciaPosition, newZoom);
  }, [planciaPosition, setPlanciaData]);

  const handleZoomOut = useCallback((newZoom) => {
    setPlanciaData(planciaPosition, newZoom);
  }, [planciaPosition, setPlanciaData]);

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
        {/* Background della plancia */}
        <PlanciaBackground />
        
        {/* Contenitore trasformabile per pan e zoom */}
        <div
          className="absolute w-full h-full transform-container"
          style={{
            transform: `scale(${planciaZoom}) translate(${planciaPosition.x}px, ${planciaPosition.y}px)`,
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {/* Renderizza tutte le carte */}
          <CarteRenderer
            carte={carte}
            selectedCardId={selectedCardId}
            onSelectCard={handleSelectCard}
            onUpdatePosizione={onUpdatePosizione}
            onRimuovi={onRimuovi}
            onRuota={onRuota}
            onScala={onScala}
            onGiraCarta={onGiraCarta}
            carteMazzo={carteMazzo}
            canDrag={haControllo()}
          />
        </div>
        
        {/* Controlli per zoom e reset */}
        <PanZoomControls
          zoom={planciaZoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={resetPlancia}
        />
      </div>
    </DndContext>
  );
};

/**
 * Componente separato per il rendering delle carte
 * Migliora le performance evitando re-render inutili del componente principale
 */
const CarteRenderer = React.memo(({
  carte,
  selectedCardId,
  onSelectCard,
  onUpdatePosizione,
  onRimuovi,
  onRuota,
  onScala,
  onGiraCarta,
  carteMazzo,
  canDrag
}) => {
  return (
    <>
      {carte.map((carta) => (
        <Carta
          key={carta.id}
          carta={carta}
          isSelected={selectedCardId === carta.id}
          onSelect={onSelectCard}
          onUpdatePosizione={onUpdatePosizione}
          onRimuovi={onRimuovi}
          onRuota={onRuota}
          onScala={onScala}
          onGira={onGiraCarta}
          carteMazzo={carteMazzo}
          canDrag={canDrag}
        />
      ))}
    </>
  );
});

CarteRenderer.displayName = 'CarteRenderer';

export default Plancia;