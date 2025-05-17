import React from 'react';

const SidebarUtenti = ({ utenti, utenteConControllo, isAdmin, onAssegnaControllo }) => {
  return (
    <div className="w-full h-full p-4 text-white">
      <h2 className="text-xl font-semibold mb-4">Utenti online</h2>
      
      {utenti.length === 0 ? (
        <p className="text-gray-400">Nessun utente connesso</p>
      ) : (
        <ul className="space-y-3">
          {utenti.map((utente) => (
            <li key={utente.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-700">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                <span>{utente.name || 'Utente'}</span>
              </div>
              
              <div>
                {utente.id === utenteConControllo ? (
                  <span className="text-xs bg-green-600 px-2 py-1 rounded">Controllo</span>
                ) : isAdmin && (
                  <button 
                    onClick={() => onAssegnaControllo(utente.id)}
                    className="text-xs bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded"
                  >
                    Dai controllo
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      
      <div className="mt-8 border-t border-gray-700 pt-4">
        <h3 className="text-lg font-medium mb-2">Stato sessione</h3>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
          <span>Connesso</span>
        </div>
        
        {isAdmin && (
          <div className="mt-4 text-xs text-gray-400">
            <p>Sei l'amministratore di questa sessione</p>
          </div>
        )}
        
        {utenteConControllo && (
          <div className="mt-2 text-sm">
            <p>
              {isAdmin 
                ? "Puoi dare il controllo ad altri utenti" 
                : utenteConControllo === utenti.find(u => u.id === utenteConControllo)?.id
                  ? "Hai il controllo della plancia"
                  : `${utenti.find(u => u.id === utenteConControllo)?.name || 'Un altro utente'} ha il controllo`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarUtenti;