import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faRotate,
  faUpRightAndDownLeftFromCenter,
  faToggleOn,
} from "@fortawesome/free-solid-svg-icons";

const CardControls = ({
  carta,
  onRimuovi,
  onStartRotation,
  onStartScale,
  handleGiraCarta,
  cardRefs,
}) => {
  return (
    <>
      {/* Remove Button */}
      <div className="absolute top-[-1.5rem] left-[-1.5rem] z-30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRimuovi(carta.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="bg-white rounded-full shadow p-1"
        >
          <FontAwesomeIcon icon={faXmark} className="text-red-500" />
        </button>
      </div>

      {/* Rotate Button */}
      <div className="absolute top-[-1.5rem] right-[-1.5rem] z-30">
        <button
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => onStartRotation(e, carta.id, carta.angle, cardRefs.current[carta.id])}
          style={{ cursor: "grab" }}
          onPointerDown={(e) => e.stopPropagation()}
          className="bg-white rounded-full shadow p-1"
        >
          <FontAwesomeIcon icon={faRotate} className="text-blue-500" />
        </button>
      </div>

      {/* Scale Button */}
      <div className="absolute bottom-[-1.5rem] right-[-1.5rem] z-30">
        <button
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => onStartScale(e, carta.id, carta.scale)}
          style={{ cursor: "ns-resize" }}
          onPointerDown={(e) => e.stopPropagation()}
          className="bg-white rounded-full shadow p-2"
          aria-label="Ridimensiona carta"
        >
          <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />
        </button>
      </div>

      {/* Toggle Front/Back Button */}
      <div className="absolute bottom-[-1.5rem] left-[-1.5rem] z-30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleGiraCarta(carta.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="bg-white rounded-full shadow p-2"
          aria-label="Gira carta"
        >
          <FontAwesomeIcon
            icon={faToggleOn}
            className={carta.isFront ? "text-gray-400" : "text-green-500"}
          />
        </button>
      </div>
    </>
  );
};

export default CardControls;