import Pusher from 'pusher-js';

class PusherService {
  constructor() {
    this.pusher = null;
    this.channel = null;
    this.isConnected = false;
  }

  // Inizializza Pusher solo se non siamo in locale
  async init(sessionId, userRole = 'viewer') {
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

    if (isLocal) {
      console.log('Modalità locale: Pusher disabilitato');
      return;
    }

    try {
      this.pusher = new Pusher(process.env.VITE_PUSHER_KEY || 'your-pusher-key', {
        cluster: process.env.VITE_PUSHER_CLUSTER || 'eu',
        encrypted: true,
      });

      this.channel = this.pusher.subscribe(`session-${sessionId}`);
      this.isConnected = true;
      
      console.log(`Connesso al canale session-${sessionId} come ${userRole}`);
    } catch (error) {
      console.error('Errore inizializzazione Pusher:', error);
    }
  }

  // Subscribe a eventi specifici
  subscribe(eventName, callback) {
    if (!this.isConnected || !this.channel) {
      console.log(`Modalità locale: evento ${eventName} ignorato`);
      return;
    }

    this.channel.bind(eventName, callback);
  }

  // Trigger eventi (solo per il creatore)
  async trigger(eventName, data) {
    if (!this.isConnected) {
      console.log(`Modalità locale: trigger ${eventName} ignorato`);
      return;
    }

    try {
      // Invia tramite API WordPress che poi trigghera Pusher
      await fetch('/wp-json/scrivania/v1/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify({
          event: eventName,
          data: data,
          channel: this.channel.name
        })
      });
    } catch (error) {
      console.error('Errore trigger evento:', error);
    }
  }

  getToken() {
    const container = document.querySelector('#root');
    return container?.dataset?.token || '';
  }

  disconnect() {
    if (this.pusher) {
      this.pusher.disconnect();
      this.isConnected = false;
    }
  }
}

export const pusherService = new PusherService();