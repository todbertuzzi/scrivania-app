import React, { useState } from 'react';
import Draggable from 'react-draggable';
import { Card } from '../components/ui/Card';

const Plancia = ({ carte, onUpdatePosizione, onRimuovi, onRuota }) => {
  const [controlliVisibili, setControlliVisibili] = useState(null);

  return (
    <div className="w-full h-full relative">
      {carte.map(carta => {
        const angle = carta.angle || 0;
        return (
          <Draggable
            key={carta.id}
            defaultPosition={{ x: carta.x, y: carta.y }}
            onStart={() => setControlliVisibili(carta.id)}
            onStop={(e, data) => onUpdatePosizione(carta.id, data.x, data.y)}
          >
            <div
              className="absolute"
              onDoubleClick={() => setControlliVisibili(carta.id)}
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <div className="relative select-none">
                {controlliVisibili === carta.id && (
                  <div className="absolute -top-3 -right-3 z-10 flex space-x-1">
                    <button onClick={() => onRuota(carta.id, (angle + 15) % 360)}>🔄</button>
                    <button onClick={() => onRimuovi(carta.id)}>❌</button>
                  </div>
                )}
                <Card className="w-32 h-44 p-1 shadow-lg bg-white overflow-hidden">
                  {carta.img ? (
                    <img
                      src={carta.img}
                      alt="Carta"
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="text-center p-4">Carta</div>
                  )}
                </Card>
              </div>
            </div>
          </Draggable>
        );
      })}
    </div>
  );
};

export default Plancia;
