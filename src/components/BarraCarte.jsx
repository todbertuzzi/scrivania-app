import React from "react";
import "../index.css";
import { getDeckById } from "../data/decks";

const BarraCarte = ({ onAggiungiCarta, deckId = 0 }) => {
  const deck = getDeckById(deckId);
  const deckCards = deck.cards;
  const deckLayout = deck.layout;
  const mediaFitClass = deckLayout.imageFit === "contain" ? "object-contain" : "object-cover";

  const handleClick = (carta) => {
    const nuovaCarta = {
      ...carta,
      templateId: carta.templateId || carta.id,
      id: `${carta.id}-${Date.now()}`,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      angle: 0,
      scale: 1.0,
      isFront: false,
      retro: carta.img,
    };
    onAggiungiCarta(nuovaCarta);
  };

  return (
    <div className="barraCarte-scroll w-full overflow-x-auto">
      <div className="holder flex flex-nowrap gap-[20px] py-1">
        {deckCards.map((carta) => (
          <div
            key={carta.id}
            className="flex-none bg-white rounded shadow cursor-pointer overflow-hidden"
            style={{
              width: `${deckLayout.trayWidth}px`,
              aspectRatio: deckLayout.aspectRatio,
            }}
            onClick={() => handleClick(carta)}
          >
            <img
              src={carta.img}
              alt={carta.nome}
              className={`w-full h-full ${mediaFitClass}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarraCarte;