import React, { useState, useRef, useEffect } from "react";
import { getAssetPath } from '../utils/paths';
import { carteMazzo } from "./BarraCarte";
import CartaDraggable from "./CartaDraggable";
import { useCardRotation } from "../hooks/useCardRotation";
import { useCardScale } from "../hooks/useCardScale";
import { usePlanciaNavigation } from "../hooks/usePlanciaNavigation";
import { LuUsers } from "react-icons/lu";
import { TbBackground } from "react-icons/tb";
const Plancia = ({
  carte,
  onRimuovi,
  onRuota,
  onScala,
  onGiraCarta,
  planciaZoom,
  planciaPosition,
  onUpdatePlancia,
  canWrite,
  canSpawn,
  onScheduleSave,
  isSidebarOpen,
  onToggleSidebar,
  onCycleBackground,
}) => {
  const [controlliVisibili, setControlliVisibili] = useState(null);
  const areaRef = useRef(null);
  const cardRefs = useRef({});

  // Hook personalizzati
  const cardRotation = useCardRotation(onRuota);
  const cardScale = useCardScale(onScala);
  const planciaNav = usePlanciaNavigation({
    initialZoom: planciaZoom ?? 1,
    initialPosition: planciaPosition ?? { x: 0, y: 0 },
    onChange: (zoom, position) => {
      if (!canWrite) return;
      onUpdatePlancia?.(zoom, position);
      onScheduleSave?.('plancia', 600);
    },
  });

  // Gestori degli eventi globali
  useEffect(() => {
    const wheelHandler = (e) => {
      const isOnPlancia = areaRef.current && areaRef.current.contains(e.target);
      const isOnTransformContainer = e.target.classList && e.target.classList.contains("transform-container");

      if (isOnPlancia || isOnTransformContainer) {
        if (!canWrite) return;
        e.preventDefault();
        planciaNav.handleZoom(e, areaRef);
      }
    };

    const handleMouseUp = () => {
      cardRotation.stopRotation();
      cardScale.stopScale();
      planciaNav.stopPanning();
      onScheduleSave?.('end-gesture', 150);
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
  }, [cardRotation, cardScale, planciaNav, canWrite, onScheduleSave]);

  const handleGiraCarta = (id) => {
    onGiraCarta(id, carteMazzo);
  };

  const getCardFrontImage = () => {
    return getAssetPath('card_front.jpg');
  };

  const pannelloControlliBottom = canSpawn ? 210 : 35;

  return (
    <div
      ref={areaRef}
      className="w-full h-full relative overflow-hidden border border-dashed border-gray-400 plancia-container"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setControlliVisibili(null);
        }
      }}
      onMouseDown={(e) => {
        if (!canWrite) return;
        planciaNav.startPanning(e);
      }}
      style={{
        cursor: canWrite ? (planciaNav.isPanning ? "grabbing" : "grab") : "default",
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
            if (!canWrite) return;
            planciaNav.startPanning(e);
          }
        }}
      >
        {carte.map((carta) => (
          <CartaDraggable
            key={carta.id}
            carta={carta}
            planciaZoom={planciaNav.planciaZoom}
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
            canWrite={canWrite}
            canSpawn={canSpawn}
          />
        ))}
      </div>

      {/* Controlli flottanti: zoom + toggle sidebar, in basso a destra */}
      <div
        className="absolute z-20 panello-controlli"
        style={{ bottom: pannelloControlliBottom, right: 25 }}
      >
        <div className="flex items-center gap-2 bg-white-70 rounded-full shadow border border-gray-200 px-3 py-2">
          <button
            type="button"
            className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-800 text-white text-sm hover:bg-gray-100 hover:text-black"
            onClick={() => {
              if (!canWrite || !areaRef.current) return;
              const rect = areaRef.current.getBoundingClientRect();
              const fakeEvent = {
                deltaY: -100,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
                preventDefault: () => {},
              };
              planciaNav.handleZoom(fakeEvent, areaRef);
            }}
            aria-label="Zoom in"
          >
            +
          </button>

          <div className="text-xs text-gray-700 min-w-[3rem] text-center">
            {Math.round(planciaNav.planciaZoom * 100)}%
          </div>

          <button
            type="button"
            className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-800 text-white text-sm hover:bg-gray-100 hover:text-black"
            onClick={() => {
              if (!canWrite || !areaRef.current) return;
              const rect = areaRef.current.getBoundingClientRect();
              const fakeEvent = {
                deltaY: 100,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
                preventDefault: () => {},
              };
              planciaNav.handleZoom(fakeEvent, areaRef);
            }}
            aria-label="Zoom out"
          >
            -
          </button>

          {typeof onCycleBackground === 'function' && (
            <button
              type="button"
              className="ml-1 h-7 px-2 text-white flex items-center bg-gray-800 justify-center rounded-full border border-gray-300 text-gray-700 text-xs hover:bg-gray-100 hover:text-black"
              onClick={onCycleBackground}
              aria-label="Cambia sfondo"
            >
              <TbBackground />
            </button>
          )}

          {typeof onToggleSidebar === 'function' && (
            <button
              type="button"
              className="ml-1 h-7 w-7 flex items-center justify-center bg-gray-800 text-white rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-black"
              onClick={onToggleSidebar}
              aria-label={isSidebarOpen ? "Nascondi elenco utenti" : "Mostra elenco utenti"}
            >
              {/* icona hamburger */}
              <span className="text-base"><LuUsers /></span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Plancia;
