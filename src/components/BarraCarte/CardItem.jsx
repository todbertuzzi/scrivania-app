/**
 * Componente per un singolo elemento carta nella barra inferiore
 */
import React from "react";

/**
 * Componente per visualizzare una singola carta nella barra di selezione
 * @param {Object} props - Props del componente
 * @param {Object} props.carta - Dati della carta
 * @param {Function} props.onClick - Callback per il click sulla carta
 * @param {boolean} props.disabled - Se la carta è disabilitata
 */
const CardItem = ({ carta, onClick, disabled = false }) => {
  return (
    <div
      className={`w-20 h-28 bg-white rounded shadow overflow-hidden transition transform 
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 hover:shadow-md'}`}
      onClick={disabled ? null : onClick}
      title={disabled ? "Non hai il controllo della plancia" : `Aggiungi ${carta.titolo}`}
    >
      <img
        src={carta.frontImg}
        alt={carta.titolo}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default CardItem;