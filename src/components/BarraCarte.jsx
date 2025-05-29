import React from "react";
import '../index.css';
import { getGameToolkitPath,getAssetPath } from '../utils/paths';


// Definiamo l'immagine del fronte comune a tutte le carte
const CARTA_FRONTE =  getAssetPath("card_front.jpg"); // Ora utilizza l'import diretto

const carteMazzo = Array.from({ length: 20 }, (_, i) => {
  const numero = i + 1;
  return {
    id: `m${numero}`,
    nome: `Carta ${numero}`,
    img: getGameToolkitPath(`NewVisionGameToolKit_image_${numero}.jpg`), // Retro specifico
    frontImg: getAssetPath("card_front.jpg"), 
  };
});

const BarraCarte = ({ onAggiungiCarta }) => {
  const handleClick = (carta) => {
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
    onAggiungiCarta(nuovaCarta);
  };

  return (
    <div className="">
      <div className="holder flex gap-[20px]">
        {carteMazzo.map((carta) => (
          <div
            key={carta.id}
            className=" w-full  bg-gray-100 rounded shadow cursor-pointer overflow-hidden"
            onClick={() => handleClick(carta)}
          >
            <img
              src={carta.frontImg || CARTA_FRONTE}
              alt={carta.titolo}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Esportiamo sia il componente che la lista delle carte per usarla in App.jsx
export { carteMazzo };
export default BarraCarte;