/**
 * Componente principale dell'applicazione
 * Versione migliorata con migliore gestione dello stato e performance
 */
import React, { useEffect } from "react";

// Componenti principali
import Plancia from "./components/Plancia";
import SidebarUtenti from "./components/SidebarUtenti";
import BarraCarte from "./components/BarraCarte";

// Context e hooks
import { SessionProvider, useSession } from "./context/SessionContext";
import { useCardsManager } from "./hooks/useCardsManager";
import { usePusher } from "./hooks/usePusher";

// Componenti comuni
import LoadingScreen from "./components/common/LoadingScreen";
import ErrorMessage from "./components/common/ErrorMessage";

// Componente interno che utilizza i hooks
const AppContent = () => {
  // Accesso al contesto della sessione
  const { sessionData, loading, error, saveSession } = useSession();
  
  // Hook per la gestione delle carte con auto-save
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
  const handleCardUpdate = React.useCallback((tipo, carta) => {
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
    
    // Auto-save opzionale (debounced)
    if (sessionData.isAdmin) {
      debouncedSave();
    }
  }, [sessionData]);
  
  // Debounced save per evitare troppe chiamate al server
  const debouncedSave = React.useMemo(
    () => debounce(() => {
      if (sessionData) {
        saveSession(sessionData.sessione || {}, carte);
      }
    }, 2000),
    [sessionData, carte, saveSession]
  );
  
  // Callback per gli eventi Pusher
  const pusherCallbacks = React.useMemo(() => ({
    onCartaMossa: (cartaId, x, y) => {
      aggiornaPosizione(cartaId, x, y);
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
        aggiornaDaServer({ ...carta, isFront });
      }
    }
  }), [aggiornaPosizione, aggiornaAngolo, aggiornaScala, aggiornaDaServer, rimuoviDaServer, carte]);
  
  // Hook per la connessione Pusher
  const { 
    connectionStatus, 
    utentiOnline, 
    pusherActions 
  } = usePusher(sessionData, pusherCallbacks);
  
  // Inizializza le carte dal sessionData
  useEffect(() => {
    if (sessionData?.carte?.length > 0) {
      setCarte(sessionData.carte);
    }
  }, [sessionData, setCarte]);
  
  // Handlers per i componenti
  const handlers = React.useMemo(() => ({
    onAggiungiCarta: (carta) => {
      aggiungiCarta(carta);
      handleCardUpdate('aggiungi', carta);
    },
    onUpdatePosizione: (cartaId, x, y) => {
      aggiornaPosizione(cartaId, x, y);
      const carta = carte.find(c => c.id === cartaId);
      if (carta) {
        handleCardUpdate('posizione', { ...carta, x, y });
      }
    },
    onRimuovi: (cartaId) => {
      const carta = carte.find(c => c.id === cartaId);
      rimuoviCarta(cartaId);
      if (carta) {
        handleCardUpdate('rimuovi', carta);
      }
    },
    onRuota: (cartaId, angolo) => {
      aggiornaAngolo(cartaId, angolo);
      const carta = carte.find(c => c.id === cartaId);
      if (carta) {
        handleCardUpdate('rotazione', { ...carta, angle: angolo });
      }
    },
    onScala: (cartaId, scala) => {
      aggiornaScala(cartaId, scala);
      const carta = carte.find(c => c.id === cartaId);
      if (carta) {
        handleCardUpdate('scala', { ...carta, scale: scala });
      }
    },
    onGiraCarta: (cartaId, carteMazzo) => {
      giraCarta(cartaId, carteMazzo);
      const carta = carte.find(c => c.id === cartaId);
      if (carta) {
        handleCardUpdate('gira', { ...carta, isFront: !carta.isFront });
      }
    },
    onPlanciaUpdate: (tipo, position, zoom) => {
      if (pusherActions) {
        pusherActions.spostaPlancia(position.x, position.y, zoom);
      }
    }
  }), [
    aggiungiCarta, aggiornaPosizione, rimuoviCarta, aggiornaAngolo, 
    aggiornaScala, giraCarta, carte, handleCardUpdate, pusherActions
  ]);
  
  // Rendering condizionale per stati di caricamento ed errore
  if (loading) {
    return <LoadingScreen message="Caricamento della sessione in corso..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  if (!sessionData) {
    return <ErrorMessage message="Nessuna sessione attiva. Verifica il token di invito." />;
  }
  
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Area principale */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header 
          connectionStatus={connectionStatus}
          sessionData={sessionData}
        />
        
        {/* Plancia principale */}
        <main className="flex-grow p-4 planciaHolder overflow-hidden">
          <Plancia
            carte={carte}
            onUpdatePosizione={handlers.onUpdatePosizione}
            onRimuovi={handlers.onRimuovi}
            onRuota={handlers.onRuota}
            onScala={handlers.onScala}
            onGiraCarta={handlers.onGiraCarta}
            onPlanciaUpdate={handlers.onPlanciaUpdate}
          />
        </main>
        
        {/* Barra delle carte */}
        <div className="barraCarte">
          <BarraCarte onAggiungiCarta={handlers.onAggiungiCarta} />
        </div>
      </div>
      
      {/* Sidebar utenti */}
      <div className="w-64 flex-shrink-0">
        <SidebarUtenti utenti={utentiOnline} />
      </div>
    </div>
  );
};

/**
 * Componente Header separato per migliore organizzazione
 */
const Header = React.memo(({ connectionStatus, sessionData }) => {
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return <span className="text-green-500">✓ Connesso</span>;
      case 'connecting':
        return <span className="text-yellow-500">⚡ Connessione...</span>;
      case 'error':
        return <span className="text-red-500">❌ Errore</span>;
      default:
        return <span className="text-gray-500">⚠ Disconnesso</span>;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Scrivania Collaborativa</h1>
          {sessionData?.isAdmin && (
            <p className="text-sm text-gray-600">Modalità Amministratore</p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            {getConnectionStatusDisplay()}
          </div>
          
          <div className="text-sm text-gray-500">
            Utente: <span className="font-medium">{sessionData?.userName}</span>
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

/**
 * Utility function per debouncing
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

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