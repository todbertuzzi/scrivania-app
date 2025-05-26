/**
 * Utility per la gestione dei percorsi delle immagini e delle risorse
 * Risolve i problemi di percorso tra ambiente di sviluppo e produzione
 */

// Determina se l'app è in ambiente di sviluppo o produzione
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Restituisce il percorso corretto per le immagini in base all'ambiente
 * @param {string} imageName - Nome del file immagine
 * @returns {string} Percorso completo dell'immagine
 */
export const getImagePath = (imageName) => {
  if (isDevelopment) {
    // In sviluppo, usa il percorso relativo alla cartella public/assets
    return `/assets/${imageName}`;
  } else {
    // In produzione, usa il percorso WordPress
    const baseUrl = '/wp-content/plugins/scrivania-collaborativa-api/js/app/scrivania-assets/';
    return `${baseUrl}${imageName}`;
  }
};

/**
 * Restituisce il percorso corretto per le carte
 * @param {number} cardNumber - Numero della carta (1-20)
 * @returns {string} Percorso completo dell'immagine della carta
 */
export const getCardBackImagePath = (cardNumber) => {
  if (isDevelopment) {
    // In sviluppo, usa il percorso relativo
    return `/assets/new_vision_game_tool_kit_image/New Vision Game Tool Kit_image_${cardNumber}.jpg`;
  } else {
    // In produzione, usa il percorso completo
    return `/wp-content/plugins/scrivania-collaborativa-api/js/app/scrivania-assets/new_vision_game_tool_kit_image/New Vision Game Tool Kit_image_${cardNumber}.jpg`;
  }
};

/**
 * Restituisce il percorso dell'immagine frontale comune a tutte le carte
 * @returns {string} Percorso dell'immagine frontale
 */
export const getCardFrontImagePath = () => {
  return getImagePath('card_front.jpg');
};

export default {
  getImagePath,
  getCardBackImagePath,
  getCardFrontImagePath
};