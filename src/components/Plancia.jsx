import React, { useState, useRef, useEffect } from "react";
import { getAssetPath } from '../utils/paths';
import { carteMazzo } from "./BarraCarte";
import CartaDraggable from "./CartaDraggable";
import { useCardRotation } from "../hooks/useCardRotation";
import { useCardScale } from "../hooks/useCardScale";
import { usePlanciaNavigation } from "../hooks/usePlanciaNavigation";

const Plancia = ({ carte, onRimuovi, onRuota, onScala, onGiraCarta }) => {
  const [controlliVisibili, setControlliVisibili] = useState(null);
  const areaRef = useRef(null);
  const cardRefs = useRef({});

  // Hook personalizzati
  const cardRotation = useCardRotation(onRuota);
  const cardScale = useCardScale(onScala);
  const planciaNav = usePlanciaNavigation();

  // Gestori degli eventi globali
  useEffect(() => {
    const wheelHandler = (e) => {
      const isOnPlancia = areaRef.current && areaRef.current.contains(e.target);
      const isOnTransformContainer = e.target.classList && e.target.classList.contains("transform-container");

      if (isOnPlancia || isOnTransformContainer) {
        e.preventDefault();
        planciaNav.handleZoom(e, areaRef);
      }
    };

    const handleMouseUp = () => {
      cardRotation.stopRotation();
      cardScale.stopScale();
      planciaNav.stopPanning();
    };

    window.addEventListener("wheel", wheelHandler, { passive: false });
    window.addEventListener("mousemove", cardRotation.handleMouseMove);
    window.addEventListener("mousemove", cardScale.handleMouseMove);
    window.addEventListener("mousemove", planciaNav.handlePanning);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("wheel", wheelHandler, { passive: false });
      window.removeEventListener("mousemove", cardRotation.handleMouseMove);
      window.removeEventListener("mousemove", cardScale.handleMouseMove);
      window.removeEventListener("mousemove", planciaNav.handlePanning);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [cardRotation, cardScale, planciaNav]);

  const handleGiraCarta = (id) => {
    onGiraCarta(id, carteMazzo);
  };

  const getCardFrontImage = () => {
    return getAssetPath('card_front.jpg');
  };

  return (
    <div
      ref={areaRef}
      className="w-full h-full relative overflow-hidden border border-dashed border-gray-400 plancia-container"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setControlliVisibili(null);
        }
      }}
      onMouseDown={planciaNav.startPanning}
      style={{
        cursor: planciaNav.isPanning ? "grabbing" : "grab",
      }}
    >
      <div
        className="absolute w-full h-full transform-container"
        style={{
          transform: `scale(${planciaNav.planciaZoom}) translate(${planciaNav.planciaPosition.x}px, ${planciaNav.planciaPosition.y}px)`,
          transformOrigin: "0 0",
          transition: "transform 0.05s ease-out",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.stopPropagation();
            setControlliVisibili(null);
          }
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.stopPropagation();
            planciaNav.startPanning(e);
          }
        }}
      >
        {carte.map((carta) => (
          <CartaDraggable
            key={carta.id}
            carta={carta}
            controlliVisibili={controlliVisibili}
            setControlliVisibili={setControlliVisibili}
            onRimuovi={onRimuovi}
            cardRefs={cardRefs}
            getCardFrontImage={getCardFrontImage}
            handleGiraCarta={handleGiraCarta}
            isPanning={planciaNav.isPanning}
            rotazioneInCorso={cardRotation.rotazioneInCorso}
            scalaInCorso={cardScale.scalaInCorso}
            onStartRotation={cardRotation.startRotation}
            onStartScale={cardScale.startScale}
          />
        ))}
      </div>

      <div className="absolute bottom-3 right-3 bg-white bg-opacity-70 px-2 py-1 rounded text-sm">
        Zoom: {Math.round(planciaNav.planciaZoom * 100)}%
      </div>
    </div>
  );
};

export default Plancia;
