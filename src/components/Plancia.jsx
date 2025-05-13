import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';

const Plancia = ({ carte, onUpdatePosizione, onRimuovi, onRuota }) => {
  const [controlliVisibili, setControlliVisibili] = useState(null);
  const areaRef = useRef(null);
  const [constraints, setConstraints] = useState(null);

  useEffect(() => {
    if (areaRef.current) {
      setConstraints(areaRef.current);
    }
  }, []);

  return (
    <div ref={areaRef} className="w-full h-full relative overflow-hidden border border-dashed border-gray-400">
      {carte.map(carta => {
        const angle = carta.angle || 0;
        return (
          <motion.div
            key={carta.id}
            className="absolute"
            drag
            dragConstraints={constraints}
            dragMomentum={false}
            initial={{ x: 10, y: 10 }}
            style={{ transform: `rotate(${angle}deg)` }}
            onDragStart={() => {
              if (controlliVisibili !== carta.id) setControlliVisibili(carta.id);
            }}
            onDragEnd={(e, info) => onUpdatePosizione(carta.id, info.point.x, info.point.y)}
          >
            {controlliVisibili === carta.id && (
              <>
                <div className="absolute top-[-10px] left-[-25px] z-30">
                  <button onClick={() => onRimuovi(carta.id)} className="bg-white rounded-full shadow p-1">X</button>
                </div>
                <div className="absolute top-[-10px] right-[-25px] z-30">
                <button onClick={() => onRuota(carta.id, (angle + 15) % 360)} onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} className="bg-white rounded-full shadow p-1">R</button>
                </div>
              </>
            )}
            <Card className={`w-auto h-[150px] p-1 bg-white overflow-hidden ${controlliVisibili === carta.id ? 'ring-4 ring-blue-400 shadow-xl' : 'shadow-lg'}`}>
              {carta.img ? (
                <img
                  src={carta.img}
                  alt="Carta"
                  className="w-full h-full object-cover rounded pointer-events-none"
                />
              ) : (
                <div className="text-center p-4">Carta</div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default Plancia;