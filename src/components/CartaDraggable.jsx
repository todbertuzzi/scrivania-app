import React, { useEffect, useMemo, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "./ui/Card";
import CardControls from "./CardControls";

const CartaDraggable = ({
  carta,
  planciaZoom,
  controlliVisibili,
  setControlliVisibili,
  onRimuovi,
  cardRefs,
  getCardFrontImage,
  handleGiraCarta,
  isPanning,
  rotazioneInCorso,
  scalaInCorso,
  onStartRotation,
  onStartScale,
  canWrite,
  canSpawn,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: carta.id,
    disabled: !canWrite || rotazioneInCorso.current || scalaInCorso.current || isPanning,
  });

  const x = carta.x ?? 100;
  const y = carta.y ?? 100;

  // Animazione low-impact per chi non può scrivere (viewer): ammorbidisce il “salto” tra snapshot.
  // Durata in base alla distanza spaziale tra stato precedente e nuovo.
  const prevPosRef = useRef(null);
  const transitionMs = useMemo(() => {
    if (canWrite) return 0;
    const prev = prevPosRef.current;
    if (!prev) return 0;

    const dx = Number(x) - Number(prev.x);
    const dy = Number(y) - Number(prev.y);
    const zoom = typeof planciaZoom === 'number' && planciaZoom > 0 ? planciaZoom : 1;
    const distancePx = Math.hypot(dx, dy) * zoom;

    const SPEED_PX_PER_SEC = 2200;
    const MIN_MS = 20;
    const MAX_MS = 220;

    const computed = (distancePx / SPEED_PX_PER_SEC) * 1000;
    const clamped = Math.max(MIN_MS, Math.min(MAX_MS, computed));
    return Math.round(clamped);
  }, [canWrite, planciaZoom, x, y]);

  useEffect(() => {
    prevPosRef.current = { x, y };
  }, [x, y]);

  const style = {
    transform: CSS.Transform.toString(transform),
    position: "absolute",
    left: x,
    top: y,
    ...(canWrite
      ? {}
      : {
          transitionProperty: "left, top",
          transitionDuration: `${transitionMs}ms`,
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="absolute"
      {...attributes}
      {...listeners}
      onMouseDown={() => {
        if (!canWrite && !canSpawn) return;
        if (controlliVisibili !== carta.id) {
          setControlliVisibili(carta.id);
        }
      }}
    >
      <div
        style={{
          transform: `rotate(${carta.angle || 0}deg) scale(${carta.scale || 1.0})`,
          transformOrigin: "center center",
          cursor: isDragging ? "grabbing" : "pointer",
          opacity: isDragging ? 0.5 : 1,
        }}
        ref={(el) => {
          cardRefs.current[carta.id] = el;
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!canWrite && !canSpawn) return;
          setControlliVisibili(carta.id);
        }}
        className="relative"
      >
        {controlliVisibili === carta.id && (canWrite || canSpawn) && (
          <CardControls
            carta={carta}
            onRimuovi={onRimuovi}
            onStartRotation={onStartRotation}
            onStartScale={onStartScale}
            handleGiraCarta={handleGiraCarta}
            cardRefs={cardRefs}
            canWrite={canWrite}
            canSpawn={canSpawn}
          />
        )}

        <Card
          className={`w-[96px] h-[150px] p-[10px] bg-white overflow-hidden ${
            controlliVisibili === carta.id
              ? "ring-4 ring-blue-400 shadow-xl"
              : "shadow-lg"
          }`}
        >
          {carta.isFront ? (
            <img
              src={carta.frontImg || getCardFrontImage()}
              alt="Fronte carta"
              className="w-full h-full object-cover rounded pointer-events-none"
            />
          ) : (
            <img
              src={carta.retro || carta.img}
              alt="Retro carta"
              className="w-full h-full object-cover rounded pointer-events-none"
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default CartaDraggable;