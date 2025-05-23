import React, { useState, useCallback } from "react";
import Plancia from "./components/Plancia";
import SidebarUtenti from "./components/SidebarUtenti";
import BarraCarte from "./components/BarraCarte";
import "./App.css";

const App = () => {
  // Modifichiamo la struttura dei dati delle carte per supportare fronte/retro
  const [carte, setCarte] = useState([]);

  const aggiungiCarta = (carta) => {
    // Aggiungiamo le proprietà per gestire il fronte/retro
    const nuovaCarta = {
      ...carta,
      isFront: true, // Inizialmente mostra il fronte
      retro: null,   // L'immagine del retro verrà assegnata quando la carta viene girata
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
        const carteDisponibili = carteMazzo.filter(c => c.id !== carta.id);
        const cartaRandom = carteDisponibili[Math.floor(Math.random() * carteDisponibili.length)];
        
        // Aggiorna la carta con il nuovo retro e cambia isFront
        return prev.map((c) => 
          c.id === id 
            ? { ...c, isFront: !c.isFront, retro: cartaRandom.img } 
            : c
        );
      } else {
        // Carta già girata in precedenza, mantieni lo stesso retro ma cambia isFront
        return prev.map((c) => 
          c.id === id 
            ? { ...c, isFront: !c.isFront } 
            : c
        );
      }
    });
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
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