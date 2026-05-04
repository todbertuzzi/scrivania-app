import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faRotate,
  faUpRightAndDownLeftFromCenter,
  faToggleOn,
} from "@fortawesome/free-solid-svg-icons";

const CONTROL_BUTTON_CLASS = "flex h-9 w-9 items-center justify-center rounded-full bg-white shadow";

const CardControls = ({
  carta,
  onRimuovi,
  onStartRotation,
  onStartScale,
  handleGiraCarta,
  cardRefs,
  canWrite,
  canSpawn,
}) => {
  return (
    <>
      {/* Remove Button */}
      {canSpawn && (
        <div className="absolute top-[-1.5rem] left-[-1.5rem] z-30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRimuovi(carta.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className={CONTROL_BUTTON_CLASS}
          >
            <FontAwesomeIcon icon={faXmark} className="text-red-500" />
          </button>
        </div>
      )}

      {/* Rotate Button */}
      {canWrite && (
        <div className="absolute top-[-1.5rem] right-[-1.5rem] z-30">
          <button
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => onStartRotation(e, carta.id, carta.angle, cardRefs.current[carta.id])}
            style={{ cursor: "grab" }}
            onPointerDown={(e) => e.stopPropagation()}
            className={CONTROL_BUTTON_CLASS}
          >
            <FontAwesomeIcon icon={faRotate} className="text-blue-500" />
          </button>
        </div>
      )}

      {/* Scale Button */}
      {canWrite && (
        <div className="absolute bottom-[-1.5rem] right-[-1.5rem] z-30">
          <button
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => onStartScale(e, carta.id, carta.scale)}
            style={{ cursor: "ns-resize" }}
            onPointerDown={(e) => e.stopPropagation()}
            className={`${CONTROL_BUTTON_CLASS} text-black`}
            aria-label="Ridimensiona carta"
          >
            <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />
          </button>
        </div>
      )}

      {/* Toggle Front/Back Button */}
      {canWrite && (
        <div className="absolute bottom-[-1.5rem] left-[-1.5rem] z-30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleGiraCarta(carta.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={CONTROL_BUTTON_CLASS}
            aria-label="Gira carta"
          >
            <FontAwesomeIcon
              icon={faToggleOn}
              className={carta.isFront ? "text-gray-400" : "text-green-500"}
            />
          </button>
        </div>
      )}
    </>
  );
};

export default CardControls;