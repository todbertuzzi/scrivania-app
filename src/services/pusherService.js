/**
 * Servizio per gestire la connessione e gli eventi Pusher
 * Versione refactored del servizio originale
 */
import Pusher from 'pusher-js';
import { PUSHER_CHANNEL_PREFIX, PUSHER_EVENTS } from '../utils/constants';

/**
 * Classe per gestire le operazioni Pusher
 */
class PusherService {
  constructor() {
    this.pusher = null;
    this.channel = null;
    this.channelName = null;
    this.callbacks = {};
    this.sessionId = null;
    this.userId = null;
    this.userName = null;
    this.initialized = false;
    
    // Verifica se Pusher è già stato inizializzato da WordPress
    if (window.scrivaniaPusher) {
      console.log('Rilevata istanza Pusher già configurata da WordPress');
      this.pusher = window.scrivaniaPusher;
      this.initialized = true;
    }
  }

  /**
   * Inizializza il servizio con i dati della sessione
   * @param {Object} sessionData - Dati della sessione
   * @param {Function} onConnectionStatusChange - Callback per cambiamenti di stato connessione
   */
  initialize(sessionData, onConnectionStatusChange) {
    if (!sessionData || !sessionData.sessionId) {
      console.error('Dati sessione mancanti:', sessionData);
      if (onConnectionStatusChange) onConnectionStatusChange('error');
      return false;
    }
    
    this.sessionId = sessionData.sessionId;
    this.userId = sessionData.userId;
    this.userName = sessionData.userName;
    this.onConnectionStatusChange = onConnectionStatusChange;
    
    // Se non abbiamo già un'istanza Pusher e non abbiamo i dati necessari, esci
    if (!this.pusher && (!window.scrivaniaPusherConfig || !window.scrivaniaPusherConfig.app_key)) {
      console.error('Configurazione Pusher mancante');
      if (onConnectionStatusChange) onConnectionStatusChange('error');
      return false;
    }
    
    return true;
  }

  /**
   * Connette al canale Pusher per la sessione corrente
   * @param {Object} handlers - Callbacks per gli eventi
   * @returns {Promise} - Promise che si risolve quando la connessione è stabilita
   */
  connect(handlers = {}) {
    return new Promise((resolve, reject) => {
      if (!this.sessionId) {
        reject(new Error('SessionId non impostato'));
        return;
      }
      
      if (this.onConnectionStatusChange) this.onConnectionStatusChange('connecting');
      
      // Salva i callbacks
      this.callbacks = handlers;
      
      // Nome del canale presence
      this.channelName = `${PUSHER_CHANNEL_PREFIX.PRESENCE}${this.sessionId}`;
      
      try {
        // Se non abbiamo già un'istanza Pusher, creane una
        if (!this.pusher) {
          const config = window.scrivaniaPusherConfig;
          this.pusher = new Pusher(config.app_key, {
            cluster: config.cluster,
            forceTLS: true,
            authEndpoint: config.auth_endpoint,
            auth: {
              headers: {
                'X-WP-Nonce': config.nonce
              },
              params: {
                user_id: this.userId,
                user_name: this.userName
              }
            }
          });
        }
        
        // Registra gli eventi di connessione Pusher
        this.pusher.connection.bind('connected', () => {
          console.log('Pusher connesso al server');
        });
        
        this.pusher.connection.bind('error', (err) => {
          console.error('Errore connessione Pusher:', err);
          if (this.onConnectionStatusChange) this.onConnectionStatusChange('error');
          reject(err);
        });
        
        // Sottoscrivi al canale
        this.channel = this.pusher.subscribe(this.channelName);
        
        // Configura gli eventi del canale
        this._setupChannelEvents();
        
        // Risolvi la promise quando la sottoscrizione è completata
        this.channel.bind('pusher:subscription_succeeded', (members) => {
          console.log(`✅ Connesso al canale ${this.channelName}`);
          
          // Converti membri in array
          const membersList = [];
          members.each((member) => {
            membersList.push({
              id: member.id,
              name: member.info?.name || "Utente sconosciuto",
              email: member.info?.email
            });
          });
          
          if (this.onConnectionStatusChange) this.onConnectionStatusChange('connected');
          
          // Risolvi con la lista dei membri
          resolve(membersList);
        });
        
        this.channel.bind('pusher:subscription_error', (error) => {
          console.error('❌ Errore sottoscrizione al canale:', error);
          if (this.onConnectionStatusChange) this.onConnectionStatusChange('error');
          reject(error);
        });
      } catch (error) {
        console.error('Errore inizializzazione Pusher:', error);
        if (this.onConnectionStatusChange) this.onConnectionStatusChange('error');
        reject(error);
      }
    });
  }

  /**
   * Configura gli eventi del canale
   * @private
   */
  _setupChannelEvents() {
    if (!this.channel) return;
    
    // Eventi utenti
    this.channel.bind('pusher:member_added', (member) => {
      console.log('👤 Nuovo utente connesso:', member.info);
      if (this.callbacks.onMemberJoined) {
        this.callbacks.onMemberJoined(member.info);
      }
    });
    
    this.channel.bind('pusher:member_removed', (member) => {
      console.log('👋 Utente disconnesso:', member.info);
      if (this.callbacks.onMemberLeft) {
        this.callbacks.onMemberLeft(member.info);
      }
    });
    
    // Eventi carte
    this.channel.bind(PUSHER_EVENTS.CARTA_SPOSTATA, (data) => {
      if (this.callbacks.onCartaMossa) {
        this.callbacks.onCartaMossa(data.cartaId, data.x, data.y);
      }
    });
    
    this.channel.bind(PUSHER_EVENTS.CARTA_RUOTATA, (data) => {
      if (this.callbacks.onCartaRotata) {
        this.callbacks.onCartaRotata(data.cartaId, data.angolo);
      }
    });
    
    this.channel.bind(PUSHER_EVENTS.CARTA_SCALATA, (data) => {
      if (this.callbacks.onCartaScalata) {
        this.callbacks.onCartaScalata(data.cartaId, data.scala);
      }
    });
    
    this.channel.bind(PUSHER_EVENTS.CARTA_AGGIUNTA, (data) => {
      if (this.callbacks.onCartaAggiunta) {
        this.callbacks.onCartaAggiunta(data.carta);
      }
    });
    
    this.channel.bind(PUSHER_EVENTS.CARTA_RIMOSSA, (data) => {
      if (this.callbacks.onCartaRimossa) {
        this.callbacks.onCartaRimossa(data.cartaId);
      }
    });
    
    this.channel.bind(PUSHER_EVENTS.CARTA_GIRATA, (data) => {
      if (this.callbacks.onCartaGirata) {
        this.callbacks.onCartaGirata(data.cartaId, data.isFront);
      }
    });
    
    // Eventi controllo
    this.channel.bind(PUSHER_EVENTS.CONTROLLO_CAMBIATO, (data) => {
      if (this.callbacks.onControlloCambiato) {
        this.callbacks.onControlloCambiato(data.utenteId, data.haControllo);
      }
    });
    
    // Eventi plancia
    this.channel.bind(PUSHER_EVENTS.PLANCIA_SPOSTATA, (data) => {
      if (this.callbacks.onPlanciaSpostata) {
        this.callbacks.onPlanciaSpostata(data.x, data.y, data.zoom);
      }
    });
    
    // Eventi client (altri utenti)
    this.channel.bind('client-carta:spostata', (data) => {
      if (this.callbacks.onCartaMossa) {
        this.callbacks.onCartaMossa(data.cartaId, data.x, data.y);
      }
    });
    
    this.channel.bind('client-carta:ruotata', (data) => {
      if (this.callbacks.onCartaRotata) {
        this.callbacks.onCartaRotata(data.cartaId, data.angolo);
      }
    });
    
    // Altri eventi client...
    this.channel.bind('client-carta:scalata', (data) => {
      if (this.callbacks.onCartaScalata) {
        this.callbacks.onCartaScalata(data.cartaId, data.scala);
      }
    });
    
    this.channel.bind('client-carta:aggiunta', (data) => {
      if (this.callbacks.onCartaAggiunta) {
        this.callbacks.onCartaAggiunta(data.carta);
      }
    });
    
    this.channel.bind('client-carta:rimossa', (data) => {
      if (this.callbacks.onCartaRimossa) {
        this.callbacks.onCartaRimossa(data.cartaId);
      }
    });
    
    this.channel.bind('client-carta:girata', (data) => {
      if (this.callbacks.onCartaGirata) {
        this.callbacks.onCartaGirata(data.cartaId, data.isFront);
      }
    });
    
    this.channel.bind('client-plancia:spostata', (data) => {
      if (this.callbacks.onPlanciaSpostata) {
        this.callbacks.onPlanciaSpostata(data.x, data.y, data.zoom);
      }
    });
  }

  /**
   * Invia un evento di spostamento carta
   * @param {string} cartaId - ID della carta
   * @param {number} x - Posizione X
   * @param {number} y - Posizione Y
   */
  triggerMuoviCarta(cartaId, x, y) {
    if (!this.channel) return false;
    return this.channel.trigger('client-carta:spostata', { cartaId, x, y });
  }

  /**
   * Invia un evento di rotazione carta
   * @param {string} cartaId - ID della carta
   * @param {number} angolo - Angolo di rotazione
   */
  triggerRuotaCarta(cartaId, angolo) {
    if (!this.channel) return false;
    return this.channel.trigger('client-carta:ruotata', { cartaId, angolo });
  }

  /**
   * Invia un evento di scala carta
   * @param {string} cartaId - ID della carta
   * @param {number} scala - Fattore di scala
   */
  triggerScalaCarta(cartaId, scala) {
    if (!this.channel) return false;
    return this.channel.trigger('client-carta:scalata', { cartaId, scala });
  }

  /**
   * Invia un evento di aggiunta carta
   * @param {Object} carta - Dati della carta
   */
  triggerAggiungiCarta(carta) {
    if (!this.channel) return false;
    return this.channel.trigger('client-carta:aggiunta', { carta });
  }

  /**
   * Invia un evento di rimozione carta
   * @param {string} cartaId - ID della carta
   */
  triggerRimuoviCarta(cartaId) {
    if (!this.channel) return false;
    return this.channel.trigger('client-carta:rimossa', { cartaId });
  }

  /**
   * Invia un evento di carta girata
   * @param {string} cartaId - ID della carta
   * @param {boolean} isFront - Se mostrare il fronte
   */
  triggerGiraCarta(cartaId, isFront) {
    if (!this.channel) return false;
    return this.channel.trigger('client-carta:girata', { cartaId, isFront });
  }

  /**
   * Invia un evento di cambio controllo
   * @param {string} utenteId - ID dell'utente
   * @param {boolean} haControllo - Se l'utente ha il controllo
   */
  triggerAssegnaControllo(utenteId, haControllo) {
    if (!this.channel) return false;
    return this.channel.trigger('client-scrivania:controllo', { utenteId, haControllo });
  }

  /**
   * Invia un evento di spostamento plancia
   * @param {number} x - Posizione X
   * @param {number} y - Posizione Y
   * @param {number} zoom - Livello di zoom
   */
  triggerSpostaPlancia(x, y, zoom) {
    if (!this.channel) return false;
    return this.channel.trigger('client-plancia:spostata', { x, y, zoom });
  }

  /**
   * Disconnette dal canale Pusher
   */
  disconnect() {
    if (this.channel && this.channelName) {
      this.pusher.unsubscribe(this.channelName);
      this.channel = null;
      this.channelName = null;
      if (this.onConnectionStatusChange) this.onConnectionStatusChange('disconnected');
    }
  }
}

// Esporta una singola istanza del servizio
const pusherService = new PusherService();
export default pusherService;