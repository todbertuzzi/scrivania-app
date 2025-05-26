import React, { useState, useCallback, useEffect } from "react";
import Plancia from "./components/Plancia";
import SidebarUtenti from "./components/SidebarUtenti";
import BarraCarte from "./components/BarraCarte";
import "./App.css";

const App = () => {
  // Modifichiamo la struttura dei dati delle carte per supportare fronte/retro
  const [carte, setCarte] = useState([]);
  const [debugInfo, setDebugInfo] = useState({});

  const [pusherChannel, setPusherChannel] = useState(null);
  const [utentiOnline, setUtentiOnline] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const aggiungiCarta = (carta) => {
    // Aggiungiamo le proprietà per gestire il fronte/retro
    const nuovaCarta = {
      ...carta,
      isFront: true, // Inizialmente mostra il fronte
      retro: null, // L'immagine del retro verrà assegnata quando la carta viene girata
    };

    setCarte((prev) => [...prev, nuovaCarta]);
  };

  const aggiornaPosizione = (id, x, y) => {
    setCarte((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)));
  };

  const rimuoviCarta = (id) => {
    setCarte((prev) => prev.filter((c) => c.id !== id));
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
  }, []);

  const aggiornaScala = (id, nuovaScala) => {
    // Limita la scala a un intervallo ragionevole
    const scalaLimitata = Math.min(Math.max(nuovaScala, 0.5), 3.0);

    setCarte((prev) =>
      prev.map((c) => (c.id === id ? { ...c, scale: scalaLimitata } : c))
    );
  };

  // Funzione per girare una carta (fronte/retro)
  const giraCarta = useCallback((id, carteMazzo) => {
    setCarte((prev) => {
      // Trova la carta da girare
      const carta = prev.find((c) => c.id === id);
      if (!carta) return prev;

      // Verifica se è la prima volta che giriamo questa carta
      if (carta.isFront && carta.retro === null) {
        // Prima volta che viene girata: scegli un'immagine casuale dal mazzo
        const carteDisponibili = carteMazzo.filter((c) => c.id !== carta.id);
        const cartaRandom =
          carteDisponibili[Math.floor(Math.random() * carteDisponibili.length)];

        // Aggiorna la carta con il nuovo retro e cambia isFront
        return prev.map((c) =>
          c.id === id
            ? { ...c, isFront: !c.isFront, retro: cartaRandom.img }
            : c
        );
      } else {
        // Carta già girata in precedenza, mantieni lo stesso retro ma cambia isFront
        return prev.map((c) =>
          c.id === id ? { ...c, isFront: !c.isFront } : c
        );
      }
    });
  }, []);

  // Hook per inizializzare Pusher
  useEffect(() => {
    // Controlla se abbiamo i dati necessari
    if (!debugInfo.token || !debugInfo.sessionId) {
      console.log("Dati mancanti per Pusher:", debugInfo);
      return;
    }

    if (!window.scrivaniaPusher) {
      console.error("Pusher non disponibile");
      setConnectionStatus("error");
      return;
    }

    console.log("=== INIZIALIZZAZIONE PUSHER ===");
    setConnectionStatus("connecting");

    // Nome del canale presence
    const channelName = `presence-scrivania-${debugInfo.sessionId}`;
    console.log("Connessione al canale:", channelName);

    try {
      // Sottoscrivi al canale
      const channel = window.scrivaniaPusher.subscribe(channelName);

      // Eventi di connessione
      channel.bind("pusher:subscription_succeeded", (members) => {
        console.log("✅ Connesso al canale Pusher!");
        console.log("Membri presenti:", members);

        // Converti membri in array
        const membersList = [];
        members.each((member) => {
          membersList.push({
            id: member.id,
            name: member.info?.name || "Utente sconosciuto",
          });
        });

        setUtentiOnline(membersList);
        setConnectionStatus("connected");
      });

      channel.bind("pusher:subscription_error", (error) => {
        console.error("❌ Errore sottoscrizione Pusher:", error);
        setConnectionStatus("error");
      });

      // Eventi utenti
      channel.bind("pusher:member_added", (member) => {
        console.log("👤 Nuovo utente connesso:", member.info);
        setUtentiOnline((prev) => [
          ...prev,
          {
            id: member.id,
            name: member.info?.name || "Utente sconosciuto",
          },
        ]);
      });

      channel.bind("pusher:member_removed", (member) => {
        console.log("👋 Utente disconnesso:", member.info);
        setUtentiOnline((prev) => prev.filter((u) => u.id !== member.id));
      });

      setPusherChannel(channel);

      // Cleanup quando il componente si smonta
      return () => {
        console.log("🔌 Disconnessione da Pusher");
        if (channel) {
          window.scrivaniaPusher.unsubscribe(channelName);
        }
      };
    } catch (error) {
      console.error("Errore inizializzazione Pusher:", error);
      setConnectionStatus("error");
    }
  }, [debugInfo.token, debugInfo.sessionId]); // Dipende da token e sessionId

  // TEST: Verifica endpoint auth
  useEffect(() => {
    if (!debugInfo.token) return;

    console.log("🔍 Testing auth endpoint...");

    /*  fetch("/wp-json/scrivania/v1/pusher-auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce":
          window.wpApiSettings?.nonce || window.scrivaniaPusherConfig?.nonce,
        // Aggiungi anche questo header alternativo
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "include", // <-- Aggiungi questo per includere i cookies
      body: JSON.stringify({
        socket_id: "test-socket-id",
        channel_name: `presence-scrivania-${debugInfo.sessionId}`,
      }),
    })
      .then((response) => {
        console.log("Auth response status:", response.status);
        return response.json();
      })
      .then((data) => {
        console.log("Auth response data:", data);
      })
      .catch((error) => {
        console.error("Auth test error:", error);
      }); */

    // Test diretto dell'endpoint con il nuovo nonce
    fetch("/wp-json/scrivania/v1/pusher-auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce":
          window.wpApiSettings?.nonce || window.scrivaniaPusherConfig?.nonce,
      },
      credentials: "include",
      body: JSON.stringify({
        socket_id: "test-socket-id-123",
        channel_name: `presence-scrivania-${debugInfo.sessionId}`,
      }),
    })
      .then((response) => {
        console.log("Direct endpoint test status:", response.status);
        return response.json();
      })
      .then((data) => {
        console.log("Direct endpoint test data:", data);
      })
      .catch((error) => {
        console.error("Direct endpoint test error:", error);
      });
  }, [debugInfo.token, debugInfo.sessionId]);

  // Hook per debug dati
  useEffect(() => {
    console.log("=== DEBUG DATI APP REACT ===");

    const rootElement = document.getElementById("root");
    console.log("Root element:", rootElement);

    if (rootElement) {
      const data = {
        token: rootElement.dataset.token,
        userId: rootElement.dataset.userId,
        userName: rootElement.dataset.userName,
        sessionId: rootElement.dataset.sessionId,
      };

      console.log("Dataset dal root element:", data);
      setDebugInfo(data);
    }

    console.log("Pusher disponibile:", !!window.scrivaniaPusher);
    console.log("Config Pusher:", window.scrivaniaPusherConfig);

    const urlParams = new URLSearchParams(window.location.search);
    console.log("Token da URL:", urlParams.get("token"));
  }, []);
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Panel di debug temporaneo */}
      <div
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          background: "white",
          border: "1px solid #ccc",
          padding: "10px",
          borderRadius: "5px",
          fontSize: "12px",
          maxWidth: "300px",
          zIndex: 1000,
        }}
      >
        <h4>🔍 Debug Info</h4>
        <div>
          <strong>Token:</strong> {debugInfo.token || "Non trovato"}
        </div>
        <div>
          <strong>User ID:</strong> {debugInfo.userId || "Non trovato"}
        </div>
        <div>
          <strong>User Name:</strong> {debugInfo.userName || "Non trovato"}
        </div>
        <div>
          <strong>Session ID:</strong> {debugInfo.sessionId || "Non trovato"}
        </div>
        <div>
          <strong>Pusher:</strong> {window.scrivaniaPusher ? "✅" : "❌"}
        </div>
        <div>
          <strong>Config:</strong> {window.scrivaniaPusherConfig ? "✅" : "❌"}
        </div>
        <div>
          <strong>Status:</strong> {connectionStatus}
        </div>
        <div>
          <strong>Utenti Online:</strong> {utentiOnline.length}
        </div>
        <div>
          <strong>Canale:</strong> {pusherChannel ? "✅" : "❌"}
        </div>
        <div>
          <strong>Nonce:</strong>{" "}
          {window.scrivaniaPusherConfig?.nonce || "Non trovato"}
        </div>
        <div>
          <strong>User ID:</strong>{" "}
          {window.scrivaniaPusherConfig?.user_id || "Non trovato"}
        </div>
        <div>
          <strong>WP API Nonce:</strong>{" "}
          {window.wpApiSettings?.nonce || "Non trovato"}
        </div>
        <div>
          <strong>Our Nonce:</strong>{" "}
          {window.scrivaniaPusherConfig?.nonce || "Non trovato"}
        </div>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <h1 className="text-2xl font-bold">Plancia!</h1>
        <div className="p-4 planciaHolder flex-grow">
          <Plancia
            carte={carte}
            onUpdatePosizione={aggiornaPosizione}
            onRimuovi={rimuoviCarta}
            onRuota={aggiornaAngolo}
            onScala={aggiornaScala}
            onGiraCarta={giraCarta}
          />
        </div>
        <div className="p-4 barraCarte">
          <BarraCarte onAggiungiCarta={aggiungiCarta} />
        </div>
      </div>

      <div className="md:flex flex-col w-64 bg-gray-800">
        <SidebarUtenti />
      </div>
    </div>
  );
};

export default App;
