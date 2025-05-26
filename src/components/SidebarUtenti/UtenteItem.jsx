/**
 * Componente per un singolo utente nella sidebar
 */
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faCrown, faUserCheck } from "@fortawesome/free-solid-svg-icons";

/**
 * Componente per visualizzare un singolo utente nella sidebar
 * @param {Object} props - Props del componente
 * @param {Object} props.utente - Dati dell'utente
 * @param {boolean} props.hasControllo - Se l'utente ha il controllo
 * @param {boolean} props.canAssignControllo - Se si può assegnare il controllo
 * @param {Function} props.onAssegnaControllo - Callback per assegnare il controllo
 */
const UtenteItem = ({ utente, hasControllo, canAssignControllo, onAssegnaControllo }) => {
  return (
    <li className={`flex justify-between items-center p-2 rounded ${utente.isSelf ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-2">
          <FontAwesomeIcon icon={faUser} className="text-gray-200" />
        </div>
        
        <div>
          <div className="font-medium flex items-center">
            {utente.name}
            {utente.isSelf && <span className="ml-1 text-xs text-gray-400">(tu)</span>}
          </div>
          
          {/* Badge che indica se l'utente ha il controllo */}
          {hasControllo && (
            <div className="text-xs flex items-center text-green-400">
              <FontAwesomeIcon icon={faCrown} className="mr-1" />
              <span>Controllo</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Pulsante per assegnare il controllo */}
      {canAssignControllo && !hasControllo && (
        <button
          onClick={onAssegnaControllo}
          className="text-xs bg-blue-600 hover:bg-blue-700 py-1 px-2 rounded flex items-center"
        >
          <FontAwesomeIcon icon={faUserCheck} className="mr-1" />
          <span>Assegna</span>
        </button>
      )}
    </li>
  );
};

export default UtenteItem;