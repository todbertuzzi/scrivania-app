import Pusher from 'pusher-js';

class PusherService {
  constructor() {
    this.pusher = null;
    this.channel = null;
    this.isConnected = false;
  }

  isReady() {
    return Boolean(this.isConnected && this.channel);
  }

  getPresenceMembers() {
    return this.channel?.members || null;
  }

  // Inizializza Pusher solo se non siamo in locale
  async init(sessionId) {
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

    if (isLocal) {
      console.log('Modalità locale: Pusher disabilitato');
      return;
    }

    const cfg = window.scrivaniaPusherConfig;
    if (!cfg?.server_ready) {
      console.log('Pusher disabilitato: server non configurato');
      return;
    }

    if (!cfg?.app_key || !cfg?.cluster || !cfg?.auth_endpoint || !cfg?.nonce) {
      console.error('Configurazione Pusher mancante (scrivaniaPusherConfig)');
      return;
    }

    try {
      this.pusher = new Pusher(cfg.app_key, {
        cluster: cfg.cluster,
        forceTLS: true,
        authEndpoint: cfg.auth_endpoint,
        auth: {
          headers: {
            'X-WP-Nonce': cfg.nonce,
          },
        },
      });

      this.channel = this.pusher.subscribe(`presence-scrivania-${sessionId}`);
      this.isConnected = true;

      console.log(`Richiesta iscrizione al canale presence-scrivania-${sessionId}`);

      try {
        this.channel.bind('pusher:subscription_succeeded', () => {
          console.log(`Subscription OK: presence-scrivania-${sessionId}`);
        });

        this.channel.bind('pusher:subscription_error', (status) => {
          console.error(`Subscription ERROR (${status}) su presence-scrivania-${sessionId}`);
        });
      } catch {
        // ignore
      }
    } catch (error) {
      console.error('Errore inizializzazione Pusher:', error);
    }
  }

  // Subscribe a eventi specifici
  subscribe(eventName, callback) {
    if (!this.isConnected || !this.channel) {
      console.log(`Modalità locale: evento ${eventName} ignorato`);
      return () => {};
    }

    this.channel.bind(eventName, callback);

    return () => {
      try {
        this.channel?.unbind(eventName, callback);
      } catch {
        // ignore
      }
    };
  }

  disconnect() {
    if (this.pusher) {
      this.pusher.disconnect();
      this.isConnected = false;
    }
  }
}

export const pusherService = new PusherService();