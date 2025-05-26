/**
 * Costanti utilizzate nell'applicazione
 */

// Configurazione della plancia
export const PLANCIA_CONFIG = {
    MIN_ZOOM: 0.5,
    MAX_ZOOM: 3.0,
    DEFAULT_ZOOM: 1.0,
    ZOOM_STEP: 0.1,
    PAN_SENSITIVITY: 1.0
  };
  
  // Configurazione delle carte
  export const CARTA_CONFIG = {
    MIN_SCALE: 0.5,
    MAX_SCALE: 3.0,
    DEFAULT_SCALE: 1.0,
    SCALE_SENSITIVITY: 0.01,
    ROTATION_SENSITIVITY: 0.5,
    DEFAULT_ANGLE: 0,
    DEFAULT_WIDTH: 'auto',
    DEFAULT_HEIGHT: '150px'
  };
  
  // Stati della connessione Pusher
  export const CONNECTION_STATUS = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    ERROR: 'error'
  };
  
  // Tipi di eventi Pusher
  export const PUSHER_EVENTS = {
    CARTA_SPOSTATA: 'carta:spostata',
    CARTA_RUOTATA: 'carta:ruotata',
    CARTA_SCALATA: 'carta:scalata',
    CARTA_AGGIUNTA: 'carta:aggiunta',
    CARTA_RIMOSSA: 'carta:rimossa',
    CARTA_GIRATA: 'carta:girata',
    CONTROLLO_CAMBIATO: 'scrivania:controllo',
    PLANCIA_SPOSTATA: 'plancia:spostata'
  };
  
  // Prefissi per i canali Pusher
  export const PUSHER_CHANNEL_PREFIX = {
    PRESENCE: 'presence-scrivania-'
  };
  
  export default {
    PLANCIA_CONFIG,
    CARTA_CONFIG,
    CONNECTION_STATUS,
    PUSHER_EVENTS,
    PUSHER_CHANNEL_PREFIX
  };