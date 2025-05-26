/**
 * Componente per mostrare messaggi di errore
 */
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faHome } from '@fortawesome/free-solid-svg-icons';

/**
 * Componente che mostra un messaggio di errore con opzione di ritorno
 * @param {Object} props - Props del componente
 * @param {string} props.message - Messaggio di errore da mostrare
 * @param {string} props.redirectUrl - URL per il pulsante di ritorno (opzionale)
 * @param {string} props.buttonText - Testo per il pulsante (opzionale)
 */
const ErrorMessage = ({ 
  message = 'Si è verificato un errore imprevisto.',
  redirectUrl = '/dashboard-utente/', 
  buttonText = 'Torna alla dashboard'
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        {/* Icona di errore */}
        <div className="text-red-500 text-5xl mb-4">
          <FontAwesomeIcon icon={faExclamationTriangle} />
        </div>
        
        {/* Titolo */}
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Errore</h2>
        
        {/* Messaggio */}
        <p className="text-gray-700 mb-6">{message}</p>
        
        {/* Pulsante di ritorno */}
        <a 
          href={redirectUrl}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <FontAwesomeIcon icon={faHome} className="mr-2" />
          {buttonText}
        </a>
      </div>
    </div>
  );
};

export default ErrorMessage;