/**
 * Componente principale dell'applicazione
 * Versione refactored che utilizza hooks personalizzati e context
 */
import React, { useEffect } from "react";
import Plancia from "./components/Plancia";
import SidebarUtenti from "./components/SidebarUtenti";
import BarraCarte from "./components/BarraCarte";
import { SessionProvider, useSession } from "./context/SessionContext";
import { useCardsManager } from "./hooks/useCardsManager";
import { usePusher } from "./hooks/usePusher";
import LoadingScreen from "./components/common/LoadingScreen";
import ErrorMessage from "./components/common/ErrorMessage";

// Componente interno che utilizza i hooks
const AppContent = () => {
  // Accesso al contesto della sessione
  const { sessionData, loading, error } = useSession();
  
  // Hook per la gestione delle carte
  const {
    carte,
    setCarte,
    aggiungiCarta,
    aggiornaPosizione,
    rimuoviCarta,
    aggiornaAngolo,
    aggiornaScala,
    giraCarta,
    aggiornaDaServer,
    rimuoviDaServer
  } = useCardsManager();
  
  // Callback per aggiornare il server quando una carta viene modificata
  const handleCardUpdate = (tipo, carta) => {
    if (!sessionData) return;
    
    // Aggiorna Pusher in base al tipo di modifica
    if (pusherActions) {
      switch (tipo) {
        case 'aggiungi':
          pusherActions.aggiungiCarta(carta);
          break;
        case 'posizione':
          pusherActions.muoviCarta(carta.id, carta.x, carta.y);
          break;
        case 'rotazione':
          pusherActions.ruotaCarta(carta.id, carta.angle);
          break;
        case 'scala':
          pusherActions.scalaCarta(carta.id, carta.scale);
          break;
        case 'gira':
          pusherActions.giraCarta(carta.id, carta.isFront);
          break;
        case 'rimuovi':
          pusherActions.rimuoviCarta(carta.id);
          break;
        default:
          break;
      }
    }
  };
  
  // Callback per gli eventi Pusher
  const pusherCallbacks = {
    onCartaMossa: (cartaId, x, y) => {
      const carta = carte.find(c => c.id === cartaId);
      if (carta) {
        aggiornaPosizione(cartaId, x, y);
      }
    },
    onCartaRotata: (cartaId, angolo) => {
      aggiornaAngolo(cartaId, angolo);
    },
    onCartaScalata: (cartaId, scala) => {
      aggiornaScala(cartaId, scala);
    },
    onCartaAggiunta: (cartaNuova) => {
      aggiornaDaServer(cartaNuova);
    },
    onCartaRimossa: (cartaId) => {
      rimuoviDaServer(cartaId);
    },
    onCartaGirata: (cartaId, isFront) => {
      const carta = carte.find(c => c.id === cartaId);
      if (carta) {
        carta.isFront = isFront;
        aggiornaDaServer(carta);
      }
    }
  };
  
  // Hook per la connessione Pusher
  const { 
    connectionStatus, 
    utentiOnline, 
    pusherActions 
  } = usePusher(sessionData, pusherCallbacks);
  
  // Inizializza le carte dal sessionData
  useEffect(() => {
    if (sessionData && sessionData.carte && sessionData.carte.length > 0) {
      setCarte(sessionData.carte);
    }
  }, [sessionData, setCarte]);
  
  // Se è in caricamento, mostra uno spinner
  if (loading) {
    return <LoadingScreen message="Caricamento della sessione in corso..." />;
  }
  
  // Se c'è un errore, mostra un messaggio
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  // Se non ci sono dati di sessione, mostra un messaggio
  if (!sessionData) {
    return <ErrorMessage message="Nessuna sessione attiva. Verifica il token di invito." />;
  }
  
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Scrivania Collaborativa</h1>
            <div className="text-sm text-gray-500">
              {connectionStatus === 'connected' ? (
                <span className="text-green-500">✓ Connesso</span>
              ) : (
                <span className="text-red-500">⚠ {connectionStatus}</span>
              )}
            </div>
          </div>
        </header>
        
        <div className="flex-grow p-4 planciaHolder overflow-hidden">
          <Plancia
            carte={carte}
            onUpdatePosizione={aggiornaPosizione}
            onRimuovi={rimuoviCarta}
            onRuota={aggiornaAngolo}
            onScala={aggiornaScala}
            onGiraCarta={giraCarta}
            onPlanciaUpdate={(tipo, position, zoom) => {
              if (pusherActions) {
                pusherActions.spostaPlancia(position.x, position.y, zoom);
              }
            }}
          />
        </div>
        
        <div className="barraCarte">
          <BarraCarte onAggiungiCarta={aggiungiCarta} />
        </div>
      </div>
      
      <div className="w-64 flex-shrink-0">
        <SidebarUtenti utenti={utentiOnline} />
      </div>
    </div>
  );
};

/**
 * Componente App principale che avvolge il contenuto con il provider di sessione
 */
const App = () => {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
};

export default App;