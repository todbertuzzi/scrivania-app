import React, { useState } from "react";
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

  const aggiornaAngolo = (id, angle) => {
    setCarte((prev) => prev.map((c) => (c.id === id ? { ...c, angle } : c)));
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
        <div className="p-4 planciaHolder flex-grow">
          <h1 className="text-2xl font-bold">Plancia!</h1>
          <div className="mt-2 text-gray-600 ">
            <Plancia
              carte={carte}
              onUpdatePosizione={aggiornaPosizione}
              onRimuovi={rimuoviCarta}
              onRuota={aggiornaAngolo}
            />
          </div>
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
