/**
 * Componente per la barra delle carte selezionabili
 * Versione refactored per risolvere i problemi di percorso delle immagini
 */
import React from "react";
import CardItem from "./CardItem";
import { getImagePath, getCardBackImagePath, getCardFrontImagePath } from "../../utils/paths";
import { useSession } from "../../context/SessionContext";

// Definiamo l'immagine del fronte comune a tutte le carte
const CARTA_FRONTE = getCardFrontImagePath();

// Array delle carte disponibili
export const carteMazzo = Array.from({ length: 20 }, (_, i) => {
  const numero = i + 1;
  return {
    id: `m${numero}`,
    titolo: `Carta ${numero}`,
    img: getCardBackImagePath(numero), // Percorso corretto per il retro
    frontImg: CARTA_FRONTE, // Percorso corretto per il fronte
  };
});

/**
 * Componente per visualizzare e selezionare le carte dal mazzo
 * @param {Object} props - Props del componente
 * @param {Function} props.onAggiungiCarta - Callback quando una carta viene aggiunta
 */
const BarraCarte = ({ onAggiungiCarta }) => {
  const { haControllo } = useSession();
  
  // Aggiunge una nuova carta alla plancia
  const handleClick = (carta) => {
    if (!haControllo()) return;
    
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
    <div className="bg-white p-4 border-t border-gray-200">
      <h3 className="text-lg font-semibold mb-3">Mazzo di carte</h3>
      <div className="holder flex flex-wrap gap-3 overflow-x-auto pb-2">
        {carteMazzo.map((carta) => (
          <CardItem 
            key={carta.id}
            carta={carta}
            onClick={() => handleClick(carta)}
            disabled={!haControllo()}
          />
        ))}
      </div>
      {!haControllo() && (
        <p className="text-sm text-gray-500 italic mt-2">
          Non hai il controllo della plancia. Attendi che il gestore ti dia il controllo per poter aggiungere carte.
        </p>
      )}
    </div>
  );
};

export default BarraCarte;