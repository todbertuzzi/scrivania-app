import React from "react";
import '../index.css';

const carteMazzo = Array.from({ length: 20 }, (_, i) => {
  const numero = i + 1;
  return {
    id: `m${numero}`,
    titolo: `Carta ${numero}`,
    img: `/assets/new_vision_game_tool_kit_image/New Vision Game Tool Kit_image_${numero}.jpg`,
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
    };
    onAggiungiCarta(nuovaCarta);
  };

  return (
    <div className="">
      <div className="holder flex">
        {carteMazzo.map((carta) => (
          <div
            key={carta.id}
            className="max-w-[150px] w-full h-32 bg-gray-100 rounded shadow cursor-pointer overflow-hidden"
            onClick={() => handleClick(carta)}
          >
            <img
              src={carta.img}
              alt={carta.titolo}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarraCarte;
