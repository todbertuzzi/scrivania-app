import React from 'react';

const utentiSimulati = [
  { id: 'u1', nome: 'Alice', controllo: true },
  { id: 'u2', nome: 'Marco', controllo: false },
  { id: 'u3', nome: 'Giulia', controllo: false },
];

const SidebarUtenti = () => {
  return (
    <div className="w-64 bg-white border-l border-gray-300 p-4 shadow-md h-full">
      <h2 className="text-lg font-semibold mb-4">Utenti online</h2>
      <ul className="space-y-2">
        {utentiSimulati.map(utente => (
          <li key={utente.id} className="flex justify-between items-center">
            <span>{utente.nome}</span>
            {utente.controllo && <span className="text-green-600 text-xs">controllo</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SidebarUtenti;
