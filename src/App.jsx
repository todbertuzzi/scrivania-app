import React, { useState,useCallback } from "react";
import Plancia from "./components/Plancia";
import SidebarUtenti from "./components/SidebarUtenti";
import BarraCarte from "./components/BarraCarte";
import "./App.css";
const App = () => {
  const [carte, setCarte] = useState([]);

  const aggiungiCarta = (carta) => {
    setCarte((prev) => [...prev, carta]);
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

      console.log("nuovo angolo", normalizzato);
      return prev.map((c) => (c.id === id ? { ...c, angle: normalizzato } : c));
    });
  }, []);

  const aggiornaScala = (id, nuovaScala) => {
    // Limita la scala a un intervallo ragionevole
    const scalaLimitata = Math.min(Math.max(nuovaScala, 0.5), 3.0);
    
    console.log("nuova scala", scalaLimitata);
    setCarte((prev) =>
      prev.map((c) => (c.id === id ? { ...c, scale: scalaLimitata } : c))
    );
  };

  return (
    /*  <div className="grid grid-cols-[1fr_300px] grid-rows-[auto_160px] h-screen bg-gray-100">
    
      <div className="col-start-1 row-start-1 bg-green-50 border-r border-gray-300 overflow-hidden">
       
      </div>

      
      <div className="col-start-1 row-start-2 bg-white border-t border-gray-300">
        <BarraCarte onAggiungiCarta={aggiungiCarta} />
      </div>

    
      <div className="col-start-2 row-span-2 bg-white border-l border-gray-300 p-4 shadow-inner overflow-y-auto">
        <SidebarUtenti />
      </div>
    </div> */
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
          />
        </div>
        <div className="p-4 barraCarte">
          <BarraCarte onAggiungiCarta={aggiungiCarta} />
        </div>
      </div>

      <div className=" md:flex flex-col w-64 bg-gray-800">
        <SidebarUtenti />
      </div>
    </div>
  );
};

export default App;
