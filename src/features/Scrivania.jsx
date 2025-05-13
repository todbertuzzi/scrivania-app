import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const carteIniziali = [
  { id: '1', titolo: 'Carta 1', x: 100, y: 100 },
  { id: '2', titolo: 'Carta 2', x: 250, y: 150 },
];

const utentiFinti = [
  { id: 'u1', nome: 'Anna', controllo: true },
  { id: 'u2', nome: 'Luca', controllo: false },
  { id: 'u3', nome: 'Sara', controllo: false },
];

const Scrivania = () => {
  const [carte, setCarte] = useState(carteIniziali);
  const [utenti, setUtenti] = useState(utentiFinti);
  const [utenteConControllo, setUtenteConControllo] = useState('u1');

  const aggiornaPosizione = (id, x, y) => {
    setCarte(prev => prev.map(c => c.id === id ? { ...c, x, y } : c));
    // Qui potresti inviare la nuova posizione via WebSocket
  };

  const assegnaControllo = (idUtente) => {
    setUtenteConControllo(idUtente);
    setUtenti(prev => prev.map(u => ({ ...u, controllo: u.id === idUtente })));
    // Qui potresti inviare l'assegnazione via WebSocket
  };

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden flex">
      {/* Sidebar Utenti */}
      <div className="w-64 bg-white shadow-md p-4 border-r border-gray-200">
        <h2 className="text-lg font-bold mb-4">Utenti online</h2>
        <ul className="space-y-2">
          {utenti.map(utente => (
            <li key={utente.id} className="flex justify-between items-center">
              <span>{utente.nome}</span>
              {utente.controllo ? (
                <span className="text-green-600 text-sm">Controllo</span>
              ) : (
                <Button size="sm" onClick={() => assegnaControllo(utente.id)}>Dai controllo</Button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Scrivania */}
      <div className="relative flex-1">
        {carte.map(carta => (
          <motion.div
            key={carta.id}
            drag={true}
            dragMomentum={false}
            className="absolute cursor-move"
            style={{ top: carta.y, left: carta.x }}
            onDragEnd={(e, info) => {
              const x = info.point.x;
              const y = info.point.y;
              aggiornaPosizione(carta.id, x, y);
            }}
          >
            <Card className="w-32 h-44 p-2 shadow-lg text-center bg-white">
              {carta.titolo}
            </Card>
          </motion.div>
        ))}

        <div className="absolute top-4 left-4 space-x-2">
          <Button onClick={() => alert('Sessione avviata')}>Avvia sessione</Button>
          <Button variant="secondary" onClick={() => alert('Sessione terminata')}>Termina</Button>
        </div>
      </div>
    </div>
  );
};

export default Scrivania;
