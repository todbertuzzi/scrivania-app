// Utility per gestire i percorsi delle immagini
export const getAssetPath = (filename) => {
  // Rileva se siamo in ambiente locale o produzione
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.port !== '';

  if (isLocal) {
    // In locale, usa il percorso delle immagini nella cartella public
    return `/assets/${filename}`;
  } else {
    // In produzione, usa il percorso WordPress
    return `/wp-content/plugins/scrivania-collaborativa-api/js/app/assets/${filename}`;
  }
};

export const getDeckAssetPath = (deckId, filename) => {
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.port !== '';

  if (isLocal) {
    return `/assets/mazzo_${deckId}/${filename}`;
  } else {
    return `/wp-content/plugins/scrivania-collaborativa-api/js/app/assets/mazzo_${deckId}/${filename}`;
  }
};

export const getGameToolkitPath = (filename) => getDeckAssetPath(0, `cards/${filename}`);

// Utility per debug - mostra quale ambiente è stato rilevato
export const getEnvironmentInfo = () => {
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.port !== '';
  
  return {
    isLocal,
    hostname: window.location.hostname,
    port: window.location.port,
    environment: isLocal ? 'development' : 'production'
  };
};