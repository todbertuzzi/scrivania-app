import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "./ui/Card";
import CardControls from "./CardControls";

const CartaDraggable = ({
  carta,
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
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: carta.id,
    disabled: rotazioneInCorso.current || scalaInCorso.current || isPanning,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    position: "absolute",
    left: carta.x || 100,
    top: carta.y || 100,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="absolute"
      {...attributes}
      {...listeners}
      onMouseDown={() => {
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
          setControlliVisibili(carta.id);
        }}
        className="relative"
      >
        {controlliVisibili === carta.id && (
          <CardControls
            carta={carta}
            onRimuovi={onRimuovi}
            onStartRotation={onStartRotation}
            onStartScale={onStartScale}
            handleGiraCarta={handleGiraCarta}
            cardRefs={cardRefs}
          />
        )}

        <Card
          className={`w-auto h-[150px] p-[10px] bg-white overflow-hidden ${
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