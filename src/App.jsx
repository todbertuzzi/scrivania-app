import React, { useState, useEffect, useCallback } from "react";
import Plancia from "./components/Plancia";
import SidebarUtenti from "./components/SidebarUtenti";
import BarraCarte from "./components/BarraCarte";
import "./App.css";
import { connectToSession, setupEventListeners, triggerEvents, disconnectFromSession } from './services/pusherService';

const App = () => {
  // Modifichiamo la struttura dei dati delle carte per supportare fronte/retro
  const [carte, setCarte] = useState([]);
  
  // Stati per la gestione della collaborazione
  const [sessionId, setSessionId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [utenti, setUtenti] = useState([]);
  const [utenteConControllo, setUtenteConControllo] = useState(null);
  const [sessione, setSessione] = useState({
    attiva: false,
    iniziata: null,
    mazzoId: null,
    sfondo: null
  });
  
  // Riferimento al canale Pusher
  const [pusherChannel, setPusherChannel] = useState(null);

  // Carica i dati di sessione dall'URL o da WP
  useEffect(() => {
    // Recupera i dati della sessione dall'API di WordPress
    const fetchSessionData = async () => {
      try {
        // Ottieni token dalla URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (!token) {
          console.error('Token mancante');
          return;
        }
        
        // Chiama l'API WordPress per ottenere i dati di sessione
        const response = await fetch('/wp-json/scrivania/v1/get-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': window.wpApiSettings?.nonce || ''
          },
          body: JSON.stringify({ token })
        });
        
        if (!response.ok) {
          throw new Error('Errore nel recupero dei dati di sessione');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Imposta i dati di sessione
          setSessionId(data.session_id);
          setUserId(data.user_id);
          setUserName(data.user_name);
          setIsAdmin(data.is_admin);
          setUtenteConControllo(data.is_admin ? data.user_id : null);
          
          // Se la sessione è già iniziata, carica lo stato della scrivania
          if (data.sessione && data.sessione.attiva) {
            setSessione(data.sessione);
            
            // Carica le carte se presenti
            if (data.carte && Array.isArray(data.carte)) {
              setCarte(data.carte);
            }
          }
        } else {
          console.error(data.message || 'Errore sconosciuto');
        }
      } catch (error) {
        console.error('Errore:', error);
      }
    };
    
    fetchSessionData();
  }, []);

  // Connetti a Pusher una volta che hai i dati di sessione
  useEffect(() => {
    if (!sessionId || !userId || !userName) return;
    
    // Connettiti al canale Pusher
    const channel = connectToSession(sessionId, userId, userName);
    setPusherChannel(channel);
    
    // Set up event listeners
    setupEventListeners(channel, {
      onSessionUpdate: (data) => {
        setSessione(data);
      },
      onCarteUpdate: (data) => {
        setCarte(data);
      },
      onUtenteControlloUpdate: (utenteId) => {
        setUtenteConControllo(utenteId);
      }
    });
    
    // Cleanup on unmount
    return () => {
      if (channel) {
        disconnectFromSession(channel);
      }
    };
  }, [sessionId, userId, userName]);

  const aggiungiCarta = (carta) => {
    // Aggiungiamo le proprietà per gestire il fronte/retro
    const nuovaCarta = {
      ...carta,
      id: `${carta.id}-${Date.now()}`,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      angle: 0,
      scale: 1.0,
      isFront: true, // Inizialmente mostra il fronte
      retro: null,   // L'immagine del retro verrà assegnata quando la carta viene girata
    };
    
    setCarte((prev) => [...prev, nuovaCarta]);
    
    // Notifica agli altri client
    if (pusherChannel) {
      triggerEvents.aggiungiCarta(pusherChannel, nuovaCarta);
    }
  };

  const aggiornaPosizione = (id, x, y) => {
    setCarte((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)));
    
    // Non è necessario inviare questo evento qui perché lo gestiamo già
    // direttamente dal componente Plancia per sincronizzare in tempo reale
  };

  const rimuoviCarta = (id) => {
    setCarte((prev) => prev.filter((c) => c.id !== id));
    
    // Non è necessario inviare questo evento qui perché lo gestiamo già
    // direttamente dal componente Plancia per sincronizzare in tempo reale
  };

  const aggiornaAngolo = useCallback((id, nuovoAngolo) => {
    const normalizzato = ((nuovoAngolo % 360) + 360) % 360;

    // Evita aggiornamenti duplicati
    setCarte((prev) => {
      const carta = prev.find((c) => c.id === id);
      // Se l'angolo è identico o molto simile, non aggiornare lo stato
      if (carta && Math.abs(carta.angle - normalizzato) < 0.1) {
        return prev; // Ritorna lo stato precedente senza cambiamenti
      }

      return prev.map((c) => (c.id === id ? { ...c, angle: normalizzato } : c));
    });
    
    // Non è necessario inviare questo evento qui perché lo gestiamo già
    // direttamente dal componente Plancia per sincronizzare in tempo reale
  }, []);

  const aggiornaScala = (id, nuovaScala) => {
    // Limita la scala a un intervallo ragionevole
    const scalaLimitata = Math.min(Math.max(nuovaScala, 0.5), 3.0);
    
    setCarte((prev) =>
      prev.map((c) => (c.id === id ? { ...c, scale: scalaLimitata } : c))
    );
    
    // Non è necessario inviare questo evento qui perché lo gestiamo già
    // direttamente dal componente Plancia per sincronizzare in tempo reale
  };
  
  // Funzione per girare una carta (fronte/retro)
  const giraCarta = useCallback((id, carteMazzo, forcedIsFront) => {
    setCarte((prev) => {
      // Trova la carta da girare
      const carta = prev.find((c) => c.id === id);
      if (!carta) return prev;
      
      // Se forcedIsFront è definito (arriva da remoto), usa quel valore
      const newIsFront = forcedIsFront !== undefined ? forcedIsFront : !carta.isFront;
      
      // Verifica se è la prima volta che giriamo questa carta
      if (carta.isFront && carta.retro === null && newIsFront === false) {
        // Prima volta che viene girata: scegli un'immagine casuale dal mazzo
        const carteDisponibili = carteMazzo.filter(c => c.id !== carta.id);
        const cartaRandom = carteDisponibili[Math.floor(Math.random() * carteDisponibili.length)];
        
        // Aggiorna la carta con il nuovo retro e cambia isFront
        return prev.map((c) => 
          c.id === id 
            ? { ...c, isFront: newIsFront, retro: cartaRandom.img } 
            : c
        );
      } else {
        // Carta già girata in precedenza, mantieni lo stesso retro ma cambia isFront
        return prev.map((c) => 
          c.id === id 
            ? { ...c, isFront: newIsFront } 
            : c
        );
      }
    });
    
    // Non è necessario inviare questo evento qui perché lo gestiamo già
    // direttamente dal componente Plancia per sincronizzare in tempo reale
  }, []);

  // Inizia la sessione (solo admin)
  const avviaSessione = useCallback(() => {
    if (!isAdmin) return;
    
    const nuovaSessione = {
      ...sessione,
      attiva: true,
      iniziata: new Date().toISOString()
    };
    
    setSessione(nuovaSessione);
    
    // Invia l'evento agli altri client
    if (pusherChannel) {
      triggerEvents.aggiornaSessione(pusherChannel, nuovaSessione);
    }
    
    // Salva lo stato sul server
    salvaStatoSessione(nuovaSessione);
  }, [isAdmin, sessione, pusherChannel]);

  // Termina la sessione (solo admin)
  const terminaSessione = useCallback(() => {
    if (!isAdmin) return;
    
    const nuovaSessione = {
      ...sessione,
      attiva: false
    };
    
    setSessione(nuovaSessione);
    
    // Invia l'evento agli altri client
    if (pusherChannel) {
      triggerEvents.aggiornaSessione(pusherChannel, nuovaSessione);
    }
    
    // Salva lo stato sul server
    salvaStatoSessione(nuovaSessione);
  }, [isAdmin, sessione, pusherChannel]);

  // Salva lo stato della sessione sul server
  const salvaStatoSessione = async (nuovaSessione = sessione) => {
    try {
      const response = await fetch('/wp-json/scrivania/v1/save-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.wpApiSettings?.nonce || ''
        },
        body: JSON.stringify({
          session_id: sessionId,
          sessione: nuovaSessione,
          carte: carte
        })
      });
      
      if (!response.ok) {
        throw new Error('Errore nel salvataggio dello stato');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        console.error(data.message || 'Errore sconosciuto');
      }
    } catch (error) {
      console.error('Errore:', error);
    }
  };

  // Salva lo stato periodicamente 
  useEffect(() => {
    if (!sessionId || !isAdmin || !sessione.attiva) return;
    
    // Salva lo stato ogni 30 secondi
    const intervallo = setInterval(() => {
      salvaStatoSessione();
    }, 30000);
    
    return () => clearInterval(intervallo);
  }, [sessionId, isAdmin, sessione.attiva, carte]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="p-4 flex justify-between items-center border-b">
          <h1 className="text-2xl font-bold">Plancia - {sessione.attiva ? 'Sessione attiva' : 'In attesa'}</h1>
          
          {isAdmin && (
            <div className="space-x-2">
              {!sessione.attiva ? (
                <button onClick={avviaSessione} className="bg-green-600 text-white px-4 py-2 rounded shadow">
                  Avvia sessione
                </button>
              ) : (
                <button onClick={terminaSessione} className="bg-red-600 text-white px-4 py-2 rounded shadow">
                  Termina sessione
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 flex-grow relative">
          <Plancia
            carte={carte}
            onUpdatePosizione={aggiornaPosizione}
            onRimuovi={rimuoviCarta}
            onRuota={aggiornaAngolo}
            onScala={aggiornaScala}
            onGiraCarta={giraCarta}
            sessionId={sessionId}
            userId={userId}
            userName={userName}
            isAdmin={isAdmin}
            utenti={utenti}
            setUtenti={setUtenti}
            utenteConControllo={utenteConControllo}
            setUtenteConControllo={setUtenteConControllo}
          />
        </div>
        
        {/* Mostra la barra carte solo se la sessione è attiva e sei l'admin o hai il controllo */}
        {sessione.attiva && (isAdmin || userId === utenteConControllo) && (
          <div className="p-4 border-t">
            <BarraCarte onAggiungiCarta={aggiungiCarta} />
          </div>
        )}
      </div>

      <div className="w-64 bg-gray-800 overflow-y-auto">
        <SidebarUtenti 
          utenti={utenti}
          utenteConControllo={utenteConControllo}
          isAdmin={isAdmin}
          onAssegnaControllo={(utenteId) => {
            setUtenteConControllo(utenteId);
            
            // Invia l'evento agli altri client
            if (pusherChannel) {
              triggerEvents.assegnaControllo(pusherChannel, utenteId);
            }
          }}
        />
      </div>
    </div>
  );
};

export default App;