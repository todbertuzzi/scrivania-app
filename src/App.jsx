import React, { useState, useCallback, useEffect } from "react";
import Plancia from "./components/Plancia";
import SidebarUtenti from "./components/SidebarUtenti";
import BarraCarte from "./components/BarraCarte";
import { useSharedState } from "./hooks/useSharedState";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from "@dnd-kit/core";
import "./App.css";

const App = () => {
  const {
    sessionData,
    userRole,
    isInitialized,
    updateCards,
    updatePlancia,
    moveCard,
    rotateCard,
    scaleCard,
  } = useSharedState();

  const [activeCard, setActiveCard] = useState(null);

  // Configurazione sensori per dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const aggiungiCarta = useCallback(
    (carta) => {
      if (userRole !== "creator") {
        console.log("Solo il creatore può aggiungere carte");
        return;
      }

      const nuovaCarta = {
        ...carta,
        isFront: true,
        retro: null,
      };

      const nuoveCarte = [...sessionData.carte, nuovaCarta];
      updateCards(nuoveCarte);
    },
    [sessionData.carte, updateCards, userRole]
  );

  const aggiornaPosizione = useCallback(
    (id, x, y) => {
      if (userRole !== "creator") return;
      moveCard(id, x, y);
    },
    [moveCard, userRole]
  );

  const rimuoviCarta = useCallback(
    (id) => {
      if (userRole !== "creator") {
        console.log("Solo il creatore può rimuovere carte");
        return;
      }

      const nuoveCarte = sessionData.carte.filter((c) => c.id !== id);
      updateCards(nuoveCarte);
    },
    [sessionData.carte, updateCards, userRole]
  );

  const aggiornaAngolo = useCallback(
    (id, nuovoAngolo) => {
      if (userRole !== "creator") return;

      const normalizzato = ((nuovoAngolo % 360) + 360) % 360;
      rotateCard(id, normalizzato);
    },
    [rotateCard, userRole]
  );

  const aggiornaScala = useCallback(
    (id, nuovaScala) => {
      if (userRole !== "creator") return;

      const scalaLimitata = Math.min(Math.max(nuovaScala, 0.5), 3.0);
      scaleCard(id, scalaLimitata);
    },
    [scaleCard, userRole]
  );

  const giraCarta = useCallback(
    (id, carteMazzo) => {
      if (userRole !== "creator") {
        console.log("Solo il creatore può girare le carte");
        return;
      }

      const nuoveCarte = sessionData.carte.map((carta) => {
        if (carta.id !== id) return carta;

        if (carta.isFront && carta.retro === null) {
          const carteDisponibili = carteMazzo.filter((c) => c.id !== carta.id);
          const cartaRandom =
            carteDisponibili[Math.floor(Math.random() * carteDisponibili.length)];
          return { ...carta, isFront: !carta.isFront, retro: cartaRandom.img };
        } else {
          return { ...carta, isFront: !carta.isFront };
        }
      });

      updateCards(nuoveCarte);
    },
    [sessionData.carte, updateCards, userRole]
  );

  // Gestori dnd-kit
  const handleDragStart = useCallback(
    (event) => {
      if (userRole !== "creator") return;

      const { active } = event;
      const carta = sessionData.carte.find((c) => c.id === active.id);
      setActiveCard(carta);
    },
    [sessionData.carte, userRole]
  );

  const handleDragEnd = useCallback(
    (event) => {
      if (userRole !== "creator") return;

      const { active, delta } = event;
      setActiveCard(null);

      if (!delta) return;

      const carta = sessionData.carte.find((c) => c.id === active.id);
      if (carta) {
        const nuovaX = (carta.x || 100) + delta.x;
        const nuovaY = (carta.y || 100) + delta.y;
        aggiornaPosizione(active.id, nuovaX, nuovaY);
      }
    },
    [sessionData.carte, aggiornaPosizione, userRole]
  );

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Caricamento sessione...</div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen bg-gray-100">
        {/* Indicatore ruolo utente */}
        <div className="absolute top-2 right-2 z-50 bg-white px-3 py-1 rounded shadow">
          <span
            className={`font-semibold ${
              userRole === "creator" ? "text-green-600" : "text-blue-600"
            }`}
          >
            {userRole === "creator" ? "Creatore" : "Spettatore"}
          </span>
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto">
          <h1 className="text-2xl font-bold">Plancia Collaborativa</h1>
          <div className="p-4 planciaHolder flex-grow">
            <Plancia
              carte={sessionData.carte}
              onUpdatePosizione={aggiornaPosizione}
              onRimuovi={rimuoviCarta}
              onRuota={aggiornaAngolo}
              onScala={aggiornaScala}
              onGiraCarta={giraCarta}
              userRole={userRole}
              onUpdatePlancia={updatePlancia}
              planciaZoom={sessionData.planciaZoom}
              planciaPosition={sessionData.planciaPosition}
            />
          </div>

          {/* Barra carte solo per il creatore */}
          {userRole === "creator" && (
            <div className="p-4 barraCarte">
              <BarraCarte onAggiungiCarta={aggiungiCarta} />
            </div>
          )}
        </div>

        <div className="md:flex flex-col w-64 bg-gray-800">
          <SidebarUtenti />
        </div>
      </div>
    </DndContext>
  );
};

export default App;
