import React, { useCallback, useMemo, useState } from "react";
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
import { getAssetPath } from "./utils/paths";
import { getDeckById, normalizeDeckId } from "./data/decks";
import bgVerde from "./assets/bgs/background_verde.jpg";
import bgLegno from "./assets/bgs/background_legno.jpg";
const isLocalEnv =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.port !== "");

const LOCAL_BACKGROUNDS = [bgVerde, bgLegno];
const REMOTE_BACKGROUNDS = [
  "bgs/background_verde.jpg",
  "bgs/background_legno.jpg",
];
const BACKGROUND_COUNT = LOCAL_BACKGROUNDS.length;

const App = () => {
  const {
    sessionData,
    sessionSettings,
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCardsTrayOpen, setIsCardsTrayOpen] = useState(true);
  const [backgroundIndex, setBackgroundIndex] = useState(0);

  const currentBackground = useMemo(() => {
    if (isLocalEnv) {
      return LOCAL_BACKGROUNDS[backgroundIndex];
    }
    return getAssetPath(REMOTE_BACKGROUNDS[backgroundIndex]);
  }, [backgroundIndex]);

  const activeDeckId = useMemo(
    () => normalizeDeckId(sessionSettings?.mazzoId),
    [sessionSettings?.mazzoId]
  );

  const activeDeck = useMemo(() => getDeckById(activeDeckId), [activeDeckId]);

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
        mazzoId: activeDeck.id,
        templateId: carta.templateId || carta.id,
        isFront: false,
        retro: carta.img,
      };

      const nuoveCarte = [...sessionData.carte, nuovaCarta];
      updateCards(nuoveCarte);
      scheduleSave('spawn', 150);
    },
    [activeDeck.id, permissions.canSpawn, scheduleSave, sessionData.carte, updateCards]
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
    (id) => {
      if (!permissions.canWrite) {
        console.log("Non hai i permessi per girare le carte");
        return;
      }

      const nuoveCarte = sessionData.carte.map((carta) => {
        if (carta.id !== id) return carta;

        return {
          ...carta,
          isFront: !carta.isFront,
          retro: carta.retro || carta.img,
        };
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
        const nuovaX = (carta.x ?? 100) + delta.x;
        const nuovaY = (carta.y ?? 100) + delta.y;
        aggiornaPosizione(active.id, nuovaX, nuovaY);
        scheduleSave('drag', 150);
      }
    },
    [permissions.canWrite, scheduleSave, sessionData.carte, aggiornaPosizione]
  );

  const handleCycleBackground = useCallback(() => {
    setBackgroundIndex((prev) => (prev + 1) % BACKGROUND_COUNT);
  }, []);

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
      <div
        className="flex h-screen bg-gray-100"
        style={{
          backgroundImage: `url(${currentBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
      >
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
        <div className="absolute top- left-2 z-50 bg-white px-3 py-1 rounded shadow">
          <span
            className={`font-semibold ${
              role === "admin" ? "text-green-600" : role === "editor" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            {role === "admin" ? "Admin" : role === "editor" ? "Editor" : "Viewer"}
          </span>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="planciaHolder flex flex-col">
            <div className="flex-1 p-0 overflow-hidden">
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
                isCardsTrayOpen={isCardsTrayOpen}
                onToggleCardsTray={() => setIsCardsTrayOpen((prev) => !prev)}
                onScheduleSave={scheduleSave}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
                onCycleBackground={handleCycleBackground}
                activeDeckId={activeDeck.id}
              />
            </div>

            {/* Barra carte solo per il creatore, interna alla plancia */}
            {permissions.canSpawn && isCardsTrayOpen && (
              <div className="barraCarte">
                <div className="barraCarte-tray absolute z-10 bg-white-80 rounded-[32px] shadow border border-gray-200 px-4 py-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-600">
                    Mazzo: {activeDeck.label} · {activeDeck.description}
                  </div>
                  <BarraCarte deckId={activeDeck.id} onAggiungiCarta={aggiungiCarta} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className={`flex flex-col bg-gray-800 h-full overflow-hidden transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "w-40" : "w-0"
          }`}
        >
          {isSidebarOpen && (
            <div className="flex-1 overflow-y-auto">
              <SidebarUtenti sessionId={sessionId} permissions={permissions} role={role} />
            </div>
          )}
        </div>
      </div>
    </DndContext>
  );
};

export default App;
