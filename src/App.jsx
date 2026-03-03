import React, { useCallback } from "react";
import Plancia from "./components/Plancia";
import SidebarUtenti from "./components/SidebarUtenti";
import BarraCarte from "./components/BarraCarte";
import { useSharedState } from "./hooks/useSharedState";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from "@dnd-kit/core";
import "./App.css";

const App = () => {
  const {
    sessionData,
    role,
    permissions,
    sessionId,
    accessRevoked,
    isInitialized,
    initError,
    updateCards,
    updatePlancia,
    moveCard,
    rotateCard,
    scaleCard,
    scheduleSave,
  } = useSharedState();

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
      if (!permissions.canSpawn) {
        console.log("Solo l'admin può aggiungere carte");
        return;
      }

      const nuovaCarta = {
        ...carta,
        isFront: true,
        retro: null,
      };

      const nuoveCarte = [...sessionData.carte, nuovaCarta];
      updateCards(nuoveCarte);
      scheduleSave('spawn', 150);
    },
    [permissions.canSpawn, scheduleSave, sessionData.carte, updateCards]
  );

  const aggiornaPosizione = useCallback(
    (id, x, y) => {
      if (!permissions.canWrite) return;
      moveCard(id, x, y);
    },
    [moveCard, permissions.canWrite]
  );

  const rimuoviCarta = useCallback(
    (id) => {
      if (!permissions.canSpawn) {
        console.log("Solo l'admin può rimuovere carte");
        return;
      }

      const nuoveCarte = sessionData.carte.filter((c) => c.id !== id);
      updateCards(nuoveCarte);
      scheduleSave('remove', 150);
    },
    [permissions.canSpawn, scheduleSave, sessionData.carte, updateCards]
  );

  const aggiornaAngolo = useCallback(
    (id, nuovoAngolo) => {
      if (!permissions.canWrite) return;

      const normalizzato = ((nuovoAngolo % 360) + 360) % 360;
      rotateCard(id, normalizzato);
    },
    [permissions.canWrite, rotateCard]
  );

  const aggiornaScala = useCallback(
    (id, nuovaScala) => {
      if (!permissions.canWrite) return;

      const scalaLimitata = Math.min(Math.max(nuovaScala, 0.5), 3.0);
      scaleCard(id, scalaLimitata);
    },
    [permissions.canWrite, scaleCard]
  );

  const giraCarta = useCallback(
    (id, carteMazzo) => {
      if (!permissions.canWrite) {
        console.log("Non hai i permessi per girare le carte");
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
      scheduleSave('flip', 200);
    },
    [permissions.canWrite, scheduleSave, sessionData.carte, updateCards]
  );

  // Gestori dnd-kit
  const handleDragStart = useCallback(() => {
    if (!permissions.canWrite) return;
  }, [permissions.canWrite]);

  const handleDragEnd = useCallback(
    (event) => {
      if (!permissions.canWrite) return;

      const { active, delta } = event;

      if (!delta) return;

      const carta = sessionData.carte.find((c) => c.id === active.id);
      if (carta) {
        const nuovaX = (carta.x || 100) + delta.x;
        const nuovaY = (carta.y || 100) + delta.y;
        aggiornaPosizione(active.id, nuovaX, nuovaY);
        scheduleSave('drag', 150);
      }
    },
    [permissions.canWrite, scheduleSave, sessionData.carte, aggiornaPosizione]
  );

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Caricamento sessione...</div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex items-center justify-center h-screen p-6">
        <div className="max-w-xl w-full bg-white rounded-lg shadow p-6">
          <div className="text-lg font-semibold mb-2">Errore avvio scrivania</div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{String(initError)}</div>
          <button
            className="px-3 py-2 rounded bg-gray-900 text-white text-sm"
            onClick={() => window.location.reload()}
          >
            Ricarica
          </button>
        </div>
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
        {accessRevoked && (
          <div className="absolute inset-0 z-[100] bg-black/50 flex items-center justify-center p-6">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <div className="text-lg font-semibold mb-2">Accesso revocato</div>
              <div className="text-sm text-gray-600 mb-4">
                Il proprietario della sessione ha revocato i tuoi permessi. Ricarica la pagina o contatta l’admin.
              </div>
              <button
                className="px-3 py-2 rounded bg-gray-900 text-white text-sm"
                onClick={() => window.location.reload()}
              >
                Ricarica
              </button>
            </div>
          </div>
        )}

        {/* Indicatore ruolo utente */}
        <div className="absolute top-2 right-2 z-50 bg-white px-3 py-1 rounded shadow">
          <span
            className={`font-semibold ${
              role === "admin" ? "text-green-600" : role === "editor" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            {role === "admin" ? "Admin" : role === "editor" ? "Editor" : "Viewer"}
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
              onUpdatePlancia={updatePlancia}
              planciaZoom={sessionData.planciaZoom}
              planciaPosition={sessionData.planciaPosition}
              canWrite={permissions.canWrite}
              canSpawn={permissions.canSpawn}
              onScheduleSave={scheduleSave}
            />
          </div>

          {/* Barra carte solo per il creatore */}
          {permissions.canSpawn && (
            <div className="p-4 barraCarte">
              <BarraCarte onAggiungiCarta={aggiungiCarta} />
            </div>
          )}
        </div>

        <div className="md:flex flex-col w-64 bg-gray-800">
          <SidebarUtenti sessionId={sessionId} permissions={permissions} role={role} />
        </div>
      </div>
    </DndContext>
  );
};

export default App;
