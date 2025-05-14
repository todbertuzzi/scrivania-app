import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';

const Plancia = ({ carte, onUpdatePosizione, onRimuovi, onRuota }) => {
  const [controlliVisibili, setControlliVisibili] = useState(null);
  const areaRef = useRef(null);
  const [constraints, setConstraints] = useState(null);
  const rotazioneInCorso = useRef(null);

  useEffect(() => {
    if (areaRef.current) {
      setConstraints(areaRef.current);
    }
  }, []);

  return (
    <div ref={areaRef} className="w-full h-full relative overflow-hidden border border-dashed border-gray-400">
      {carte.map(carta => {
        
        return (
          <motion.div
            key={carta.id}
            className="absolute"
            drag={!rotazioneInCorso.current}
            dragConstraints={constraints}
            dragMomentum={false}
            initial={{ x: 10, y: 10 }}
            /* animate={{ rotate: carta.angle || 0 }} */
            style={{ transform: `rotate(${carta.angle || 0}deg)`, position: 'absolute' }}
            
            onDragStart={() => {
              if (controlliVisibili !== carta.id) setControlliVisibili(carta.id);
            }}
            onDragEnd={(e, info) => onUpdatePosizione(carta.id, info.point.x, info.point.y)}
          >
            {controlliVisibili === carta.id && (
              <>
                <div className="absolute top-[-1.5rem] left-[-1.5rem] z-30">
                  <button onClick={() => onRimuovi(carta.id)} onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} className="bg-white rounded-full shadow p-1">❌</button>
                </div>
                <div className="absolute top-[-1.5rem] right-[-1.5rem] z-30">
                  <button
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      rotazioneInCorso.current = true;
                      const button = e.currentTarget;
                      const cartaDiv = button.closest('.absolute');
                      const rect = cartaDiv.getBoundingClientRect();
                      const centerX = rect.left + rect.width / 2;
                      const centerY = rect.top + rect.height / 2;

                      const move = (moveEvent) => {
                        const currentX = moveEvent.clientX;
                        const currentY = moveEvent.clientY;
                        const currentAngle = Math.atan2(currentY - centerY, currentX - centerX) * 180 / Math.PI;
                        onRuota(carta.id, currentAngle);
                      };

                      const up = () => {
                        rotazioneInCorso.current = false;
                        window.removeEventListener('mousemove', move);
                        window.removeEventListener('mouseup', up);
                      };

                      window.addEventListener('mousemove', move);
                      window.addEventListener('mouseup', up);
                    }}
                    
                 
                    onPointerDown={(e) => e.stopPropagation()} className="bg-white rounded-full shadow p-1">🔄</button>
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
