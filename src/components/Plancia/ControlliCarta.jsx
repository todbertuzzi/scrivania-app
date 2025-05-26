/**
 * Componente per i controlli di manipolazione della carta
 */
import React, { useRef, useState, useCallback } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faRotate,
  faUpRightAndDownLeftFromCenter,
  faToggleOn,
} from "@fortawesome/free-solid-svg-icons";
import { CARTA_CONFIG } from '../../utils/constants';

/**
 * Componente che mostra i controlli per manipolare una carta
 * @param {Object} props - Props del componente
 * @param {Object} props.carta - Dati della carta
 * @param {Function} props.onRimuovi - Callback per rimuovere la carta
 * @param {Function} props.onRuota - Callback per ruotare la carta
 * @param {Function} props.onScala - Callback per scalare la carta
 * @param {Function} props.onGira - Callback per girare la carta
 * @param {Object} props.cardRef - Riferimento all'elemento carta
 */
const ControlliCarta = ({ carta, onRimuovi, onRuota, onScala, onGira, cardRef }) => {
  // Riferimento per l'elemento rotazione
  const rotationRef = useRef(null);
  // Riferimento per l'elemento scala
  const scaleRef = useRef(null);
  
  // Stato per gestire la rotazione
  const [rotationActive, setRotationActive] = useState(false);
  // Stato per gestire la scala
  const [scaleActive, setScaleActive] = useState(false);
  
  // Informazioni per la rotazione
  const rotationInfo = useRef({
    startCardAngle: 0,
    startMouseAngle: 0,
    centerX: 0,
    centerY: 0,
    lastDeltaAngle: 0
  });
  
  // Informazioni per la scala
  const scaleInfo = useRef({
    startScale: 1.0,
    startMouseY: 0
  });

  /**
   * Inizia l'operazione di rotazione
   * @param {MouseEvent} e - Evento del mouse
   */
  const handleRotationStart = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    
    setRotationActive(true);
    
    // Calcola il centro della carta per la rotazione
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calcola l'angolo iniziale del mouse rispetto al centro
      const startMouseAngle = (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;
      
      // Salva le informazioni per l'operazione di rotazione
      rotationInfo.current = {
        startCardAngle: carta.angle || 0,
        startMouseAngle,
        centerX,
        centerY,
        lastDeltaAngle: 0
      };
      
      // Aggiungi gli event listener globali
      window.addEventListener('mousemove', handleRotationMove);
      window.addEventListener('mouseup', handleRotationEnd);
    }
  }, [carta.angle, cardRef]);

  /**
   * Gestisce il movimento durante la rotazione
   * @param {MouseEvent} e - Evento del mouse
   */
  const handleRotationMove = useCallback((e) => {
    if (!rotationActive) return;
    
    const {
      startCardAngle,
      startMouseAngle,
      centerX,
      centerY,
      lastDeltaAngle = 0,
    } = rotationInfo.current;

    // Calcola l'angolo corrente del mouse rispetto al centro
    const currentMouseAngle = (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;

    // Calcola la differenza di angolo
    let angleDiff = currentMouseAngle - startMouseAngle;

    // Normalizza l'angleDiff per gestire i salti tra -180° e +180°
    if (angleDiff - lastDeltaAngle > 180) {
      angleDiff -= 360;
    } else if (angleDiff - lastDeltaAngle < -180) {
      angleDiff += 360;
    }

    // Memorizza questa differenza di angolo per il prossimo frame
    rotationInfo.current.lastDeltaAngle = angleDiff;

    // Calcola il nuovo angolo della carta
    let newAngle = startCardAngle + angleDiff * CARTA_CONFIG.ROTATION_SENSITIVITY;
    
    // Normalizza l'angolo tra 0 e 360
    newAngle = ((newAngle % 360) + 360) % 360;

    // Aggiorna l'angolo della carta
    onRuota(newAngle);
  }, [rotationActive, onRuota]);

  /**
   * Termina l'operazione di rotazione
   */
  const handleRotationEnd = useCallback(() => {
    setRotationActive(false);
    window.removeEventListener('mousemove', handleRotationMove);
    window.removeEventListener('mouseup', handleRotationEnd);
  }, [handleRotationMove]);

  /**
   * Inizia l'operazione di scala
   * @param {MouseEvent} e - Evento del mouse
   */
  const handleScaleStart = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    
    setScaleActive(true);
    
    // Salva le informazioni per l'operazione di scala
    scaleInfo.current = {
      startScale: carta.scale || 1.0,
      startMouseY: e.clientY
    };
    
    // Aggiungi gli event listener globali
    window.addEventListener('mousemove', handleScaleMove);
    window.addEventListener('mouseup', handleScaleEnd);
  }, [carta.scale]);

  /**
   * Gestisce il movimento durante la scala
   * @param {MouseEvent} e - Evento del mouse
   */
  const handleScaleMove = useCallback((e) => {
    if (!scaleActive) return;
    
    const { startScale, startMouseY } = scaleInfo.current;
    
    // Calcola lo spostamento verticale del mouse (verso l'alto = zoom in, verso il basso = zoom out)
    const deltaY = startMouseY - e.clientY;
    
    // Calcola la nuova scala
    let newScale = startScale + deltaY * CARTA_CONFIG.SCALE_SENSITIVITY;
    
    // Limita la scala a un intervallo ragionevole
    newScale = Math.max(CARTA_CONFIG.MIN_SCALE, Math.min(CARTA_CONFIG.MAX_SCALE, newScale));
    
    // Aggiorna la scala della carta
    onScala(newScale);
  }, [scaleActive, onScala]);

  /**
   * Termina l'operazione di scala
   */
  const handleScaleEnd = useCallback(() => {
    setScaleActive(false);
    window.removeEventListener('mousemove', handleScaleMove);
    window.removeEventListener('mouseup', handleScaleEnd);
  }, [handleScaleMove]);

  return (
    <>
      {/* REMOVE BTN */}
      <div className="absolute top-[-1.5rem] left-[-1.5rem] z-30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRimuovi();
          }}
          className="bg-white rounded-full shadow p-1"
        >
          <FontAwesomeIcon
            icon={faXmark}
            className="text-red-500"
          />
        </button>
      </div>
      
      {/* ROTATE BTN */}
      <div className="absolute top-[-1.5rem] right-[-1.5rem] z-30">
        <button
          ref={rotationRef}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={handleRotationStart}
          style={{ cursor: "grab" }}
          className="bg-white rounded-full shadow p-1"
        >
          <FontAwesomeIcon
            icon={faRotate}
            className="text-blue-500"
          />
        </button>
      </div>
      
      {/* SCALE BTN */}
      <div className="absolute bottom-[-1.5rem] right-[-1.5rem] z-30">
        <button
          ref={scaleRef}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={handleScaleStart}
          style={{ cursor: "ns-resize" }}
          className="bg-white rounded-full shadow p-2"
          aria-label="Ridimensiona carta"
        >
          <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />
        </button>
      </div>
      
      {/* TOGGLE FRONT/BACK BTN */}
      <div className="absolute bottom-[-1.5rem] left-[-1.5rem] z-30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onGira();
          }}
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

export default ControlliCarta;