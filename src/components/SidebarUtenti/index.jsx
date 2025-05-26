/**
 * Componente per la barra laterale che mostra gli utenti online
 */
import React from "react";
import UtenteItem from "./UtenteItem";
import { useSession } from "../../context/SessionContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt, faInfoCircle } from "@fortawesome/free-solid-svg-icons";

/**
 * Componente per visualizzare la barra laterale con gli utenti online
 * @param {Object} props - Props del componente
 * @param {Array} props.utenti - Lista degli utenti online
 * @param {boolean} props.mostraControllo - Se mostrare i controlli di assegnazione controllo
 */
const SidebarUtenti = ({ utenti = [], mostraControllo = true }) => {
  // Accesso al contesto della sessione
  const { isAdmin, controlloUtente, cambiaControllo, sessionData } = useSession();

  // Calcola se l'utente corrente è l'amministratore
  const isSelfAdmin = isAdmin;
  
  // Gestisce l'assegnazione del controllo a un utente
  const handleAssegnaControllo = (utenteId) => {
    if (!isSelfAdmin) return;
    cambiaControllo(utenteId);
  };
  
  // Ottieni l'utente corrente dai dati di sessione
  const currentUserId = sessionData?.userId;
  
  // Aggiungi l'utente corrente all'inizio della lista se non è presente
  const utenteCorrente = currentUserId && !utenti.some(u => u.id === currentUserId) 
    ? {
        id: currentUserId,
        name: sessionData?.userName || 'Tu',
        isSelf: true
      } 
    : null;
    
  // Unisci l'utente corrente con gli altri utenti
  const utenteList = utenteCorrente 
    ? [utenteCorrente, ...utenti.filter(u => u.id !== currentUserId)]
    : utenti.map(u => ({
        ...u,
        isSelf: u.id === currentUserId
      }));

  return (
    <div className="bg-gray-800 text-white p-4 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Utenti online</h2>
      
      {/* Lista degli utenti */}
      <div className="flex-grow overflow-y-auto">
        {utenteList.length === 0 ? (
          <p className="text-gray-400">Nessun utente connesso</p>
        ) : (
          <ul className="space-y-2">
            {utenteList.map((utente) => (
              <UtenteItem
                key={utente.id}
                utente={utente}
                hasControllo={utente.id === controlloUtente}
                canAssignControllo={isSelfAdmin && mostraControllo}
                onAssegnaControllo={() => handleAssegnaControllo(utente.id)}
              />
            ))}
          </ul>
        )}
      </div>
      
      {/* Sezione info */}
      <div className="mt-4 pt-4 border-t border-gray-700 text-sm">
        <div className="flex items-center mb-2">
          <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-gray-400" />
          <span>
            {isSelfAdmin 
              ? 'Sei l\'amministratore della sessione.' 
              : 'Sessione gestita dall\'amministratore.'}
          </span>
        </div>
        
        {/* Stato del controllo */}
        <div className="mb-4">
          <p className="text-gray-400">
            {controlloUtente === currentUserId 
              ? 'Hai il controllo della plancia.' 
              : 'Non hai il controllo della plancia.'}
          </p>
        </div>
        
        {/* Pulsante di uscita */}
        <button 
          className="flex items-center px-3 py-2 bg-red-700 hover:bg-red-800 rounded w-full"
          onClick={() => window.location.href = '/dashboard-utente/'}
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
          Esci dalla sessione
        </button>
      </div>
    </div>
  );
};

export default SidebarUtenti;