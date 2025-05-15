import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card } from "../components/ui/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faRotate,
  faUpRightAndDownLeftFromCenter,
  faToggleOff,
} from "@fortawesome/free-solid-svg-icons";

const Plancia = ({ carte, onUpdatePosizione, onRimuovi, onRuota, onScala }) => {
  const [controlliVisibili, setControlliVisibili] = useState(null);
  const areaRef = useRef(null);
  const [constraints, setConstraints] = useState(null);
  const rotazioneInCorso = useRef(false);
  const scalaInCorso = useRef(false);
  const cardRefs = useRef({});
  
  // Stati per il pan e zoom dell'intera plancia
  const [planciaZoom, setPlanciaZoom] = useState(1);
  const [planciaPosition, setPlanciaPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartPosition = useRef({ x: 0, y: 0 });
  const panStartMousePosition = useRef({ x: 0, y: 0 });

  // Informazioni sulla rotazione corrente
  const rotazioneInfo = useRef({
    attiva: false,
    cartaId: null,
    startCardAngle: 0,
    startMouseX: 0,
    startMouseY: 0,
    centerX: 0,
    centerY: 0,
    ultimoAngolo: 0,
    lastUpdateTime: 0,
    sensibilita: 0.5, // Regola questa sensibilità per controllare quanto velocemente ruota la carta
  });

  // Informazioni sulla scala
  const scalaInfo = useRef({
    attiva: false,
    cartaId: null,
    startScale: 1.0,
    startMouseY: 0,
    lastUpdateTime: 0,
    ultimaScala: 1.0,
    sensibilita: 0.01,
  });

  // Funzione di gestione del movimento del mouse globale
  const handleGlobalMouseMove = useCallback(
    (e) => {
      if (!rotazioneInfo.current.attiva) return;

      const now = Date.now();
      if (now - rotazioneInfo.current.lastUpdateTime < 16) return;

      const {
        cartaId,
        startCardAngle,
        startMouseAngle,
        centerX,
        centerY,
        lastDeltaAngle = 0, // Usa questo per tenere traccia dell'ultima differenza di angolo
      } = rotazioneInfo.current;

      // Calcola l'angolo corrente del mouse rispetto al centro della carta
      const currentMouseAngle =
        (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;

      // Calcola la differenza di angolo
      let angleDiff = currentMouseAngle - startMouseAngle;

      // Normalizza l'angleDiff per gestire i salti tra -180° e +180°
      if (angleDiff - lastDeltaAngle > 180) {
        angleDiff -= 360;
      } else if (angleDiff - lastDeltaAngle < -180) {
        angleDiff += 360;
      }

      // Memorizza questa differenza di angolo per il prossimo frame
      rotazioneInfo.current.lastDeltaAngle = angleDiff;

      // Calcola il nuovo angolo della carta
      const newAngle = startCardAngle + angleDiff;

      // Evita aggiornamenti duplicati con lo stesso angolo
      if (Math.abs(newAngle - rotazioneInfo.current.ultimoAngolo) < 0.2) return;

      rotazioneInfo.current.ultimoAngolo = newAngle;
      rotazioneInfo.current.lastUpdateTime = now;

      // Aggiorna l'angolo della carta
      onRuota(cartaId, newAngle);
    },
    [onRuota]
  );

  // Funzione di gestione del rilascio del mouse globale
  const handleGlobalMouseUp = useCallback(() => {
    rotazioneInfo.current.attiva = false;
    rotazioneInCorso.current = false;
    
    // Termina anche il panning se in corso
    if (isPanning) {
      setIsPanning(false);
    }
  }, [isPanning]);

  const handleGlobalMouseMoveScale = useCallback(
    (e) => {
      if (!scalaInfo.current.attiva) return;

      const now = Date.now();
      if (now - scalaInfo.current.lastUpdateTime < 16) return;

      const { cartaId, startScale, startMouseY, sensibilita } =
        scalaInfo.current;

      // Calcola lo spostamento verticale del mouse (verso l'alto = zoom in, verso il basso = zoom out)
      const deltaY = startMouseY - e.clientY;

      // Calcola la nuova scala
      let newScale = startScale + deltaY * sensibilita;

      // Limita la scala a un intervallo ragionevole e arrotonda a 2 decimali
      newScale = Math.max(0.5, Math.min(3.0, newScale));
      newScale = Math.round(newScale * 100) / 100;

      if (newScale === scalaInfo.current.ultimaScala) return;

      scalaInfo.current.ultimaScala = newScale;
      scalaInfo.current.lastUpdateTime = now;

      // Aggiorna la scala della carta
      onScala(cartaId, newScale);
    },
    [onScala]
  );
  
  // Gestione panning della plancia
  const handlePlanciaMouseDown = useCallback((e) => {
    // Verifichiamo se il click è sulla plancia o sul contenitore di trasformazione
    // permettendo il panning in entrambi i casi
    const isOnPlancia = e.currentTarget === areaRef.current && e.target === e.currentTarget;
    const isOnTransformContainer = e.target.classList.contains('transform-container');
    
    if (isOnPlancia || isOnTransformContainer) {
      e.stopPropagation();
      setIsPanning(true);
      panStartPosition.current = { ...planciaPosition };
      panStartMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  }, [planciaPosition]);
  
  const handlePlanciaMouseMove = useCallback((e) => {
    if (isPanning) {
      const deltaX = e.clientX - panStartMousePosition.current.x;
      const deltaY = e.clientY - panStartMousePosition.current.y;
      
      // Assicuriamoci che il movimento sia abbastanza significativo
      // per evitare piccoli movimenti accidentali
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        setPlanciaPosition({
          x: panStartPosition.current.x + deltaX,
          y: panStartPosition.current.y + deltaY
        });
      }
    }
  }, [isPanning]);
  
  // Gestione zoom con rotellina del mouse
  const handlePlanciaWheel = useCallback((e) => {
    // Non chiamiamo più e.preventDefault() per evitare l'errore con gli eventi passivi
    
    // Determina la direzione dello zoom (positivo = zoom out, negativo = zoom in)
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    
    // Calcola il nuovo fattore di zoom, mantenendolo entro limiti ragionevoli
    const newZoom = Math.max(0.5, Math.min(3, planciaZoom + delta));
    
    // Calcola il punto di riferimento per lo zoom (posizione del mouse)
    const rect = areaRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calcola la nuova posizione mantenendo il punto sotto il mouse invariato
    const scale = newZoom / planciaZoom;
    const newX = mouseX - (mouseX - planciaPosition.x) * scale;
    const newY = mouseY - (mouseY - planciaPosition.y) * scale;
    
    setPlanciaZoom(newZoom);
    setPlanciaPosition({ x: newX, y: newY });
  }, [planciaZoom, planciaPosition]);

  // Funzione per gestire il rilascio del mouse durante la scala
  const handleGlobalMouseUpScale = useCallback(() => {
    scalaInfo.current.attiva = false;
    scalaInCorso.current = false;
  }, []);

  useEffect(() => {
    // Configurazione del wheel event con opzione passive: false per consentire preventDefault
    // Questo risolve il problema degli eventi wheel passivi, ma richiede un approccio diverso
    const wheelHandler = (e) => {
      // Solo se l'evento avviene sulla plancia o sul contenitore di trasformazione
      const isOnPlancia = areaRef.current && areaRef.current.contains(e.target);
      const isOnTransformContainer = e.target.classList && e.target.classList.contains('transform-container');
      
      if (isOnPlancia || isOnTransformContainer) {
        e.preventDefault(); // Ora funziona perché non è un listener passivo
        handlePlanciaWheel(e);
      }
    };
    
    // Usiamo l'opzione { passive: false } per consentire preventDefault sugli eventi wheel
    window.addEventListener('wheel', wheelHandler, { passive: false });

    // I tuoi event listener per la rotazione...
    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    // Aggiungi gli event listener per la scala
    window.addEventListener("mousemove", handleGlobalMouseMoveScale);
    window.addEventListener("mouseup", handleGlobalMouseUpScale);
    
    // Aggiungi l'event listener per il movimento del mouse durante il panning
    window.addEventListener("mousemove", handlePlanciaMouseMove);

    // Rimuovi tutti gli event listener quando il componente viene smontato
    return () => {
      window.removeEventListener('wheel', wheelHandler, { passive: false });
      
      // Rimuovi gli event listener per la rotazione...
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);

      // Rimuovi gli event listener per la scala
      window.removeEventListener("mousemove", handleGlobalMouseMoveScale);
      window.removeEventListener("mouseup", handleGlobalMouseUpScale);
      
      // Rimuovi l'event listener per il panning
      window.removeEventListener("mousemove", handlePlanciaMouseMove);
    };
  }, [
    handleGlobalMouseMove,
    handleGlobalMouseUp,
    handleGlobalMouseMoveScale,
    handleGlobalMouseUpScale,
    handlePlanciaMouseMove,
    handlePlanciaWheel,
  ]);

  useEffect(() => {
    if (areaRef.current) {
      setConstraints(areaRef.current);
    }
  }, []);

  return (
    <div
      ref={areaRef}
      className="w-full h-full relative overflow-hidden border border-dashed border-gray-400 plancia-container"
      onClick={(e) => {
        // Verifica se il click è direttamente sulla plancia
        if (e.target === e.currentTarget) {
          setControlliVisibili(null);
        }
      }}
      onMouseDown={handlePlanciaMouseDown}
      onWheel={(e) => {
        // Rimuoviamo questo handler poiché ora gestiamo l'evento wheel a livello globale
        // con opzione passive: false per consentire preventDefault
      }}
      style={{
        cursor: isPanning ? 'grabbing' : 'grab',
      }}
    >
      <div
        className="absolute w-full h-full transform-container"
        style={{
          transform: `scale(${planciaZoom}) translate(${planciaPosition.x}px, ${planciaPosition.y}px)`,
          transformOrigin: '0 0',
          transition: 'transform 0.05s ease-out',
        }}
        onClick={(e) => {
          // Interrompe la propagazione per evitare che il click arrivi alla plancia
          // solo se è direttamente sul contenitore
          if (e.target === e.currentTarget) {
            e.stopPropagation();
            setControlliVisibili(null);
          }
        }}
        onMouseDown={(e) => {
          // Se il click è direttamente sul contenitore, attiviamo il panning
          if (e.target === e.currentTarget) {
            e.stopPropagation();
            setIsPanning(true);
            panStartPosition.current = { ...planciaPosition };
            panStartMousePosition.current = { x: e.clientX, y: e.clientY };
          }
        }}
      >
        {carte.map((carta) => {
          return (
            <motion.div
              key={carta.id}
              className="absolute"
              drag={!rotazioneInCorso.current && !scalaInCorso.current && !isPanning}
              dragConstraints={constraints}
              dragMomentum={false}
              initial={{ x: carta.x || 100, y: carta.y || 100 }}
              style={{ position: "absolute" }}
              onDragStart={() => {
                if (controlliVisibili !== carta.id)
                  setControlliVisibili(carta.id);
              }}
              onDragEnd={(e, info) =>
                onUpdatePosizione(carta.id, info.point.x, info.point.y)
              }
            >
              {/* Contenitore che ruota */}
              <div
                style={{
                  transform: `rotate(${carta.angle || 0}deg) scale(${
                    carta.scale || 1.0
                  })`,
                  transformOrigin: "center center",
                  cursor: "pointer" // Aggiungi questa riga
                }}
                ref={(el) => {
                  cardRefs.current[carta.id] = el;
                }}
                onClick={(e) => {
                  e.stopPropagation(); // Previene la propagazione al div principale
                  setControlliVisibili(carta.id);
                }}
                className="relative"
              >
                {controlliVisibili === carta.id && (
                  <>
                    {/* REMOVE BTN */}
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
                        <FontAwesomeIcon
                          icon={faXmark}
                          className="text-red-500"
                        />
                      </button>
                    </div>
                    {/* ROTATE BTN */}
                    <div className="absolute top-[-1.5rem] right-[-1.5rem] z-30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();

                          rotazioneInCorso.current = true;

                          // Usa il ref per accedere all'elemento della carta
                          const cardElement = cardRefs.current[carta.id];
                          let centerX, centerY;

                          if (cardElement) {
                            // Se il ref è disponibile, usa l'elemento della carta
                            const rect = cardElement.getBoundingClientRect();
                            centerX = rect.left + rect.width / 2;
                            centerY = rect.top + rect.height / 2;
                          } else {
                            // Fallback al metodo precedente se il ref non è disponibile
                            const cartaDiv = e.currentTarget.closest(".absolute");
                            const rect = cartaDiv.getBoundingClientRect();
                            centerX = rect.left + rect.width / 2;
                            centerY = rect.top + rect.height / 2;
                          }

                          const startMouseAngle =
                            (Math.atan2(
                              e.clientY - centerY,
                              e.clientX - centerX
                            ) *
                              180) /
                            Math.PI;
                          const startCardAngle = carta.angle || 0;

                          rotazioneInfo.current = {
                            attiva: true,
                            cartaId: carta.id,
                            startCardAngle,
                            startMouseAngle,
                            centerX,
                            centerY,
                            lastDeltaAngle: 0,
                            ultimoAngolo: carta.angle || 0,
                            lastUpdateTime: Date.now(),
                          };
                        }}
                        style={{ cursor: "grab" }}
                        onPointerDown={(e) => e.stopPropagation()}
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
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();

                          scalaInCorso.current = true;

                          scalaInfo.current = {
                            attiva: true,
                            cartaId: carta.id,
                            startScale: carta.scale || 1.0,
                            startMouseY: e.clientY,
                            lastUpdateTime: Date.now(),
                            ultimaScala: carta.scale || 1.0,
                            sensibilita: 0.01,
                          };
                        }}
                        style={{ cursor: "ns-resize" }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="bg-white rounded-full shadow p-2"
                        aria-label="Ridimensiona carta"
                      >
                        <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />
                      </button>
                    </div>

                    {/* SWITCH BTN */}
                    <div className="absolute bottom-[-1.5rem] left-[-1.5rem] z-30">
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        className="bg-white rounded-full shadow p-2"
                        aria-label="Gira carta"
                      >
                        <FontAwesomeIcon icon={faToggleOff} />
                      </button>
                    </div>
                  </>
                )}

                <Card
                  className={`w-auto h-[150px] p-1 bg-white overflow-hidden ${
                    controlliVisibili === carta.id
                      ? "ring-4 ring-blue-400 shadow-xl"
                      : "shadow-lg"
                  }`}
                >
                  {carta.img ? (
                    <img
                      src={carta.img}
                      alt="Carta"
                      className="w-full h-full object-cover rounded pointer-events-none"
                    />
                  ) : (
                    <div className="text-center p-4">Carta</div>
                  )}
                </Card>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Indicatore dello zoom (opzionale) */}
      <div className="absolute bottom-3 right-3 bg-white bg-opacity-70 px-2 py-1 rounded text-sm">
        Zoom: {Math.round(planciaZoom * 100)}%
      </div>
    </div>
  );
};

export default Plancia;