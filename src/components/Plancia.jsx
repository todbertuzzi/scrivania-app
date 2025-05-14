import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card } from "../components/ui/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faRotate, faUpRightAndDownLeftFromCenter } from "@fortawesome/free-solid-svg-icons";

const Plancia = ({ carte, onUpdatePosizione, onRimuovi, onRuota }) => {
  const [controlliVisibili, setControlliVisibili] = useState(null);
  const areaRef = useRef(null);
  const [constraints, setConstraints] = useState(null);
  const rotazioneInCorso = useRef(false);

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

  // Funzione di gestione del movimento del mouse globale
  const handleGlobalMouseMove = useCallback(
    (e) => {
      if (!rotazioneInfo.current.attiva) return;

      const now = Date.now();
      if (now - rotazioneInfo.current.lastUpdateTime < 16) return;

      const {
        cartaId,
        startCardAngle,
        startMouseX,
        startMouseY,
        centerX,
        centerY,
        sensibilita,
      } = rotazioneInfo.current;

      // Calcola il vettore dal centro della carta alla posizione iniziale del mouse
      const vStartX = startMouseX - centerX;
      const vStartY = startMouseY - centerY;

      // Calcola il vettore dal centro della carta alla posizione attuale del mouse
      const vCurrentX = e.clientX - centerX;
      const vCurrentY = e.clientY - centerY;

      // Normalizza i vettori
      const startLength = Math.sqrt(vStartX * vStartX + vStartY * vStartY);
      const currentLength = Math.sqrt(
        vCurrentX * vCurrentX + vCurrentY * vCurrentY
      );

      // Se i vettori sono troppo corti, non fare nulla per evitare movimenti erratici
      if (startLength < 5 || currentLength < 5) return;

      // Calcola l'angolo tra i due vettori
      const dotProduct = vStartX * vCurrentX + vStartY * vCurrentY;
      const crossProduct = vStartX * vCurrentY - vStartY * vCurrentX;

      // L'angolo tra i due vettori in radianti
      let angleDiff = Math.atan2(crossProduct, dotProduct);

      // Converti in gradi
      angleDiff = (angleDiff * 180) / Math.PI;

      // Applica una sensibilità per rendere la rotazione più o meno reattiva
      // angleDiff *= sensibilita;

      // Calcola il nuovo angolo
      const newAngle = (startCardAngle + angleDiff + 360) % 360;

      // Evita aggiornamenti duplicati
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
  }, []);

  // Configura gli event listener globali una sola volta
  useEffect(() => {
    // Aggiungi gli event listener globali
    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    // Rimuovi gli event listener quando il componente viene smontato
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  useEffect(() => {
    if (areaRef.current) {
      setConstraints(areaRef.current);
    }
  }, []);

  return (
    <div
      ref={areaRef}
      className="w-full h-full relative overflow-hidden border border-dashed border-gray-400"
    >
      {carte.map((carta) => {
        return (
          <motion.div
            key={carta.id}
            className="absolute"
            drag={!rotazioneInCorso.current}
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
              style={{ transform: `rotate(${carta.angle || 0}deg)` }}
              className="relative"
            >
              {controlliVisibili === carta.id && (
                <>
                  <div className="absolute top-[-1.5rem] left-[-1.5rem] z-30">
                    <button
                      onClick={() => onRimuovi(carta.id)}
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
                  <div className="absolute top-[-1.5rem] right-[-1.5rem] z-30">
                    <button
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault(); // Previeni comportamento di default

                        const cartaDiv = e.currentTarget.closest(".absolute");
                        const rect = cartaDiv.getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;

                        // Imposta le informazioni sulla rotazione corrente
                        rotazioneInfo.current = {
                          attiva: true,
                          cartaId: carta.id,
                          startCardAngle: carta.angle || 0,
                          startMouseX: e.clientX,
                          startMouseY: e.clientY,
                          centerX,
                          centerY,
                          ultimoAngolo: carta.angle || 0,
                          lastUpdateTime: Date.now(),
                          sensibilita: 0.5, // Puoi regolare questo valore
                        };

                        rotazioneInCorso.current = true;
                      }}
                      // Cambia cursore per indicare che si può ruotare
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
                  <div className="absolute bottom-[-1.5rem] right-[-1.5rem] z-30">
                    <button>
                        <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter}/>
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
  );
};

export default Plancia;
