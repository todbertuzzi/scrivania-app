import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faRotate,
  faUpRightAndDownLeftFromCenter,
  faToggleOn,
  faUsers
} from "@fortawesome/free-solid-svg-icons";
import { carteMazzo } from "./BarraCarte";
import cardFrontImage from '../assets/card_front.jpg';
import { connectToSession, setupEventListeners, triggerEvents, disconnectFromSession } from '../services/pusherService';

const Plancia = ({ 
  carte, 
  onUpdatePosizione, 
  onRimuovi, 
  onRuota, 
  onScala, 
  onGiraCarta,
  sessionId,
  userId,
  userName,
  isAdmin,
  utenti,
  setUtenti,
  utenteConControllo,
  setUtenteConControllo
}) => {
  const [controlliVisibili, setControlliVisibili] = useState(null);
  const areaRef = useRef(null);
  const [constraints, setConstraints] = useState(null);
  const rotazioneInCorso = useRef(false);
  const scalaInCorso = useRef(false);
  const cardRefs = useRef({});
  const [showUserList, setShowUserList] = useState(false);
  
  // Stati per il pan e zoom dell'intera plancia
  const [planciaZoom, setPlanciaZoom] = useState(1);
  const [planciaPosition, setPlanciaPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartPosition = useRef({ x: 0, y: 0 });
  const panStartMousePosition = useRef({ x: 0, y: 0 });

  // Riferimento al canale Pusher
  const channelRef = useRef(null);

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
    sensibilita: 0.5,
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

  // Flag per evitare loop infiniti negli eventi
  const updatingFromRemote = useRef(false);

  // Connessione a Pusher e configurazione degli handler
  useEffect(() => {
    if (!sessionId || !userId || !userName) return;

    // Connessione al canale
    const channel = connectToSession(sessionId, userId, userName);
    channelRef.current = channel;

    // Configurazione handlers per gli eventi
    setupEventListeners(channel, {
      onMembersUpdated: (members) => {
        setUtenti(members);
      },
      onMemberLeft: (member) => {
        setUtenti(prev => prev.filter(u => u.id !== member.id));
      },
      onMemberJoined: (member) => {
        setUtenti(prev => [...prev, member]);
      },
      onCartaMossa: (cartaId, x, y) => {
        updatingFromRemote.current = true;
        onUpdatePosizione(cartaId, x, y);
        updatingFromRemote.current = false;
      },
      onCartaRotata: (cartaId, angolo) => {
        updatingFromRemote.current = true;
        onRuota(cartaId, angolo);
        updatingFromRemote.current = false;
      },
      onCartaScalata: (cartaId, scala) => {
        updatingFromRemote.current = true;
        onScala(cartaId, scala);
        updatingFromRemote.current = false;
      },
      onControlloCambiato: (utenteId, haControllo) => {
        setUtenteConControllo(utenteId);
      },
      onCartaAggiunta: (carta) => {
        // Qui dovresti avere una funzione per aggiungere carte
        // che può essere chiamata da questo handler
      },
      onCartaRimossa: (cartaId) => {
        updatingFromRemote.current = true;
        onRimuovi(cartaId);
        updatingFromRemote.current = false;
      },
      onCartaGirata: (cartaId, isFront) => {
        updatingFromRemote.current = true;
        // Qui assumo che onGiraCarta possa accettare un terzo parametro
        // che indica il valore esplicito di isFront
        onGiraCarta(cartaId, carteMazzo, isFront);
        updatingFromRemote.current = false;
      },
      onPlanciaSpostata: (x, y, zoom) => {
        updatingFromRemote.current = true;
        setPlanciaPosition({ x, y });
        setPlanciaZoom(zoom);
        updatingFromRemote.current = false;
      }
    });

    return () => {
      if (channelRef.current) {
        disconnectFromSession(channelRef.current);
      }
    };
  }, [sessionId, userId, userName, setUtenti, onUpdatePosizione, onRuota, onScala, onGiraCarta, onRimuovi, setUtenteConControllo]);

  // Funzione di gestione del movimento del mouse globale per rotazione
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
        lastDeltaAngle = 0,
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
      
      // Invia l'evento agli altri client solo se non stiamo già aggiornando da un evento remoto
      if (!updatingFromRemote.current && channelRef.current) {
        triggerEvents.ruotaCarta(channelRef.current, cartaId, newAngle);
      }
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

      // Calcola lo spostamento verticale del mouse
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
      
      // Invia l'evento agli altri client
      if (!updatingFromRemote.current && channelRef.current) {
        triggerEvents.scalaCarta(channelRef.current, cartaId, newScale);
      }
    },
    [onScala]
  );
  
  // Gestione panning della plancia
  const handlePlanciaMouseDown = useCallback((e) => {
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
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        const newPosition = {
          x: panStartPosition.current.x + deltaX,
          y: panStartPosition.current.y + deltaY
        };
        
        setPlanciaPosition(newPosition);
        
        // Invia l'evento agli altri client (ma non troppo frequentemente)
        if (!updatingFromRemote.current && channelRef.current) {
          // Throttling per non inviare troppi eventi
          if (!isPanning.lastSent || Date.now() - isPanning.lastSent > 50) {
            triggerEvents.spostaPLancia(channelRef.current, newPosition.x, newPosition.y, planciaZoom);
            isPanning.lastSent = Date.now();
          }
        }
      }
    }
  }, [isPanning, planciaZoom]);
  
  // Gestione zoom con rotellina del mouse
  const handlePlanciaWheel = useCallback((e) => {
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
    
    const newPosition = { x: newX, y: newY };
    
    setPlanciaZoom(newZoom);
    setPlanciaPosition(newPosition);
    
    // Invia l'evento agli altri client
    if (!updatingFromRemote.current && channelRef.current) {
      // Throttling per non inviare troppi eventi
      if (!handlePlanciaWheel.lastSent || Date.now() - handlePlanciaWheel.lastSent > 100) {
        triggerEvents.spostaPLancia(channelRef.current, newPosition.x, newPosition.y, newZoom);
        handlePlanciaWheel.lastSent = Date.now();
      }
    }
  }, [planciaZoom, planciaPosition]);

  // Funzione per gestire il rilascio del mouse durante la scala
  const handleGlobalMouseUpScale = useCallback(() => {
    scalaInfo.current.attiva = false;
    scalaInCorso.current = false;
  }, []);

  // Funzione wrapper per aggiornare la posizione di una carta
  const handleUpdatePosizione = useCallback((cartaId, x, y) => {
    onUpdatePosizione(cartaId, x, y);
    
    // Invia l'evento agli altri client
    if (!updatingFromRemote.current && channelRef.current) {
      triggerEvents.muoviCarta(channelRef.current, cartaId, x, y);
    }
  }, [onUpdatePosizione]);

  // Funzione wrapper per rimuovere una carta
  const handleRimuoviCarta = useCallback((cartaId) => {
    onRimuovi(cartaId);
    
    // Invia l'evento agli altri client
    if (!updatingFromRemote.current && channelRef.current) {
      triggerEvents.rimuoviCarta(channelRef.current, cartaId);
    }
  }, [onRimuovi]);

  // Funzione per girare una carta
  const handleGiraCarta = useCallback((cartaId) => {
    const carta = carte.find(c => c.id === cartaId);
    const newIsFront = !carta.isFront;
    
    onGiraCarta(cartaId, carteMazzo);
    
    // Invia l'evento agli altri client
    if (!updatingFromRemote.current && channelRef.current) {
      triggerEvents.giraCarta(channelRef.current, cartaId, newIsFront);
    }
  }, [carte, onGiraCarta]);

  // Funzione per assegnare il controllo a un utente
  const assegnaControllo = useCallback((utenteId) => {
    setUtenteConControllo(utenteId);
    
    // Invia l'evento agli altri client
    if (channelRef.current) {
      triggerEvents.assegnaControllo(channelRef.current, utenteId, true);
    }
  }, [setUtenteConControllo]);

  useEffect(() => {
    // Configurazione del wheel event con opzione passive: false 
    const wheelHandler = (e) => {
      const isOnPlancia = areaRef.current && areaRef.current.contains(e.target);
      const isOnTransformContainer = e.target.classList && e.target.classList.contains('transform-container');
      
      if ((isOnPlancia || isOnTransformContainer) && 
          // Solo l'admin o l'utente con controllo può zoomare
          (isAdmin || userId === utenteConControllo)) {
        e.preventDefault();
        handlePlanciaWheel(e);
      }
    };
    
    window.addEventListener('wheel', wheelHandler, { passive: false });
    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("mousemove", handleGlobalMouseMoveScale);
    window.addEventListener("mouseup", handleGlobalMouseUpScale);
    window.addEventListener("mousemove", handlePlanciaMouseMove);

    return () => {
      window.removeEventListener('wheel', wheelHandler, { passive: false });
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("mousemove", handleGlobalMouseMoveScale);
      window.removeEventListener("mouseup", handleGlobalMouseUpScale);
      window.removeEventListener("mousemove", handlePlanciaMouseMove);
    };
  }, [
    handleGlobalMouseMove,
    handleGlobalMouseUp,
    handleGlobalMouseMoveScale,
    handleGlobalMouseUpScale,
    handlePlanciaMouseMove,
    handlePlanciaWheel,
    isAdmin,
    userId,
    utenteConControllo
  ]);

  useEffect(() => {
    if (areaRef.current) {
      setConstraints(areaRef.current);
    }
  }, []);

  // Determina se l'utente corrente ha il controllo
  const haControllo = isAdmin || userId === utenteConControllo;

  return (
    <div
      ref={areaRef}
      className="w-full h-full relative overflow-hidden border border-dashed border-gray-400 plancia-container"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setControlliVisibili(null);
        }
      }}
      onMouseDown={haControllo ? handlePlanciaMouseDown : undefined}
      style={{
        cursor: isPanning && haControllo ? 'grabbing' : haControllo ? 'grab' : 'default',
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
          if (e.target === e.currentTarget) {
            e.stopPropagation();
            setControlliVisibili(null);
          }
        }}
        onMouseDown={haControllo ? (e) => {
          if (e.target === e.currentTarget) {
            e.stopPropagation();
            setIsPanning(true);
            panStartPosition.current = { ...planciaPosition };
            panStartMousePosition.current = { x: e.clientX, y: e.clientY };
          }
        } : undefined}
      >
        {carte.map((carta) => {
          return (
            <motion.div
              key={carta.id}
              className="absolute"
              drag={haControllo && !rotazioneInCorso.current && !scalaInCorso.current && !isPanning}
              dragConstraints={constraints}
              dragMomentum={false}
              initial={{ x: carta.x || 100, y: carta.y || 100 }}
              style={{ position: "absolute" }}
              onDragStart={() => {
                if (controlliVisibili !== carta.id && haControllo)
                  setControlliVisibili(carta.id);
              }}
              onDragEnd={(e, info) => {
                if (haControllo) {
                  handleUpdatePosizione(carta.id, info.point.x, info.point.y);
                }
              }}
            >
              {/* Contenitore che ruota */}
              <div
                style={{
                  transform: `rotate(${carta.angle || 0}deg) scale(${
                    carta.scale || 1.0
                  })`,
                  transformOrigin: "center center",
                  cursor: haControllo ? "pointer" : "default"
                }}
                ref={(el) => {
                  cardRefs.current[carta.id] = el;
                }}
                onClick={(e) => {
                  if (haControllo) {
                    e.stopPropagation(); // Previene la propagazione al div principale
                    setControlliVisibili(carta.id);
                  }
                }}
                className="relative"
              >
                {controlliVisibili === carta.id && haControllo && (
                  <>
                    {/* REMOVE BTN */}
                    <div className="absolute top-[-1.5rem] left-[-1.5rem] z-30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRimuoviCarta(carta.id);
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

                    {/* TOGGLE FRONT/BACK BTN */}
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
                )}

                <Card
                  className={`w-auto h-[150px] p-[10px] bg-white overflow-hidden ${
                    controlliVisibili === carta.id
                      ? "ring-4 ring-blue-400 shadow-xl"
                      : "shadow-lg"
                  }`}
                >
                  {/* Mostra l'immagine appropriata in base a isFront */}
                  {carta.isFront ? (
                    // Mostra il fronte (comune a tutte le carte)
                    <img
                      src={carta.frontImg || cardFrontImage}
                      alt="Fronte carta"
                      className="w-full h-full object-cover rounded pointer-events-none"
                    />
                  ) : (
                    // Mostra il retro (specifico per questa carta)
                    <img
                      src={carta.retro || carta.img}
                      alt="Retro carta"
                      className="w-full h-full object-cover rounded pointer-events-none"
                    />
                  )}
                </Card>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Indicatore dello zoom */}
      <div className="absolute bottom-3 right-3 bg-white bg-opacity-70 px-2 py-1 rounded text-sm">
        Zoom: {Math.round(planciaZoom * 100)}%
      </div>

      {/* Indicatore di controllo */}
      <div className="absolute top-3 left-3 bg-white bg-opacity-70 px-2 py-1 rounded text-sm">
        {haControllo ? 
          <span className="text-green-600 font-bold">Hai il controllo</span> : 
          <span className="text-gray-600">In attesa di controllo</span>
        }
      </div>

      {/* Lista utenti connessi */}
      <div className="absolute top-3 right-3 z-40">
        <button 
          onClick={() => setShowUserList(!showUserList)}
          className="bg-white rounded-full shadow p-2 flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faUsers} />
          <span className="ml-1">{utenti.length}</span>
        </button>

        {showUserList && (
          <div className="absolute right-0 top-10 bg-white shadow-lg rounded p-3 w-56">
            <h4 className="text-sm font-bold mb-2">Utenti connessi</h4>
            <ul className="max-h-40 overflow-y-auto">
              {utenti.map((utente) => (
                <li key={utente.id} className="flex justify-between items-center mb-1 text-sm">
                  <span>{utente.name || 'Utente'}</span>
                  {utente.id === utenteConControllo ? (
                    <span className="text-green-600 text-xs">Ha controllo</span>
                  ) : isAdmin && (
                    <button 
                      onClick={() => assegnaControllo(utente.id)}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Dai controllo
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Plancia;