/**
 * Componente per mostrare una schermata di caricamento
 */
import React from 'react';

/**
 * Componente che mostra un indicatore di caricamento con messaggio opzionale
 * @param {Object} props - Props del componente
 * @param {string} props.message - Messaggio da mostrare
 */
const LoadingScreen = ({ message = 'Caricamento in corso...' }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        {/* Spinner di caricamento */}
        <div className="inline-block w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mb-4"></div>
        
        {/* Messaggio */}
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;