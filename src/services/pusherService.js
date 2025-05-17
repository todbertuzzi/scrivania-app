// src/services/pusherService.js

import Pusher from 'pusher-js';

// Inizializzazione di Pusher
const pusher = new Pusher(process.env.REACT_APP_PUSHER_KEY, {
  cluster: process.env.REACT_APP_PUSHER_CLUSTER,
  forceTLS: true
});

// Funzione per connettersi a un canale privato di sessione
export const connectToSession = (sessionId, userId, userName) => {
  // Canale privato per la sessione
  const channelName = `presence-scrivania-${sessionId}`;
  
  // Aggiungi autenticazione personalizzata per i canali privati
  pusher.config.auth = {
    headers: {
      'X-WP-Nonce': window.nonce // Assumiamo che il nonce WP sia disponibile globalmente
    },
    params: {
      user_id: userId,
      user_name: userName
    }
  };

  // Connessione al canale
  const channel = pusher.subscribe(channelName);

  return channel;
};

// Gestione degli eventi
export const setupEventListeners = (channel, handlers) => {
  // Evento quando un utente si unisce alla sessione
  channel.bind('pusher:subscription_succeeded', (members) => {
    if (handlers.onMembersUpdated) {
      const membersList = [];
      members.each((member) => membersList.push(member.info));
      handlers.onMembersUpdated(membersList);
    }
  });

  // Evento quando un utente lascia la sessione
  channel.bind('pusher:member_removed', (member) => {
    if (handlers.onMemberLeft) {
      handlers.onMemberLeft(member.info);
    }
  });

  // Evento quando un utente si unisce alla sessione
  channel.bind('pusher:member_added', (member) => {
    if (handlers.onMemberJoined) {
      handlers.onMemberJoined(member.info);
    }
  });

  // Evento per aggiornare la posizione di una carta
  channel.bind('carta:spostata', (data) => {
    if (handlers.onCartaMossa) {
      handlers.onCartaMossa(data.cartaId, data.x, data.y);
    }
  });

  // Evento per aggiornare la rotazione di una carta
  channel.bind('carta:ruotata', (data) => {
    if (handlers.onCartaRotata) {
      handlers.onCartaRotata(data.cartaId, data.angolo);
    }
  });

  // Evento per aggiornare la scala di una carta
  channel.bind('carta:scalata', (data) => {
    if (handlers.onCartaScalata) {
      handlers.onCartaScalata(data.cartaId, data.scala);
    }
  });

  // Evento per aggiornare il controllo della scrivania
  channel.bind('scrivania:controllo', (data) => {
    if (handlers.onControlloCambiato) {
      handlers.onControlloCambiato(data.utenteId, data.haCOntrollo);
    }
  });

  // Evento per aggiungere una nuova carta
  channel.bind('carta:aggiunta', (data) => {
    if (handlers.onCartaAggiunta) {
      handlers.onCartaAggiunta(data.carta);
    }
  });

  // Evento per rimuovere una carta
  channel.bind('carta:rimossa', (data) => {
    if (handlers.onCartaRimossa) {
      handlers.onCartaRimossa(data.cartaId);
    }
  });

  // Evento per girare una carta
  channel.bind('carta:girata', (data) => {
    if (handlers.onCartaGirata) {
      handlers.onCartaGirata(data.cartaId, data.isFront);
    }
  });

  // Evento per il pan della plancia
  channel.bind('plancia:spostata', (data) => {
    if (handlers.onPlanciaSpostata) {
      handlers.onPlanciaSpostata(data.x, data.y, data.zoom);
    }
  });
};

// Trigger degli eventi
export const triggerEvents = {
  muoviCarta: (channel, cartaId, x, y) => {
    channel.trigger('client-carta:spostata', { cartaId, x, y });
  },
  
  ruotaCarta: (channel, cartaId, angolo) => {
    channel.trigger('client-carta:ruotata', { cartaId, angolo });
  },
  
  scalaCarta: (channel, cartaId, scala) => {
    channel.trigger('client-carta:scalata', { cartaId, scala });
  },
  
  assegnaControllo: (channel, utenteId, haControllo) => {
    channel.trigger('client-scrivania:controllo', { utenteId, haControllo });
  },
  
  aggiungiCarta: (channel, carta) => {
    channel.trigger('client-carta:aggiunta', { carta });
  },
  
  rimuoviCarta: (channel, cartaId) => {
    channel.trigger('client-carta:rimossa', { cartaId });
  },
  
  giraCarta: (channel, cartaId, isFront) => {
    channel.trigger('client-carta:girata', { cartaId, isFront });
  },
  
  spostaPLancia: (channel, x, y, zoom) => {
    channel.trigger('client-plancia:spostata', { x, y, zoom });
  }
};

// Disconnettersi da un canale
export const disconnectFromSession = (channel) => {
  pusher.unsubscribe(channel.name);
};