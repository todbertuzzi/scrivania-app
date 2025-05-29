/**
 * Servizio per l'interazione con le API WordPress
 */

/**
 * Classe per le chiamate API
 */
class ApiService {
    constructor() {
        // Rileva se stiamo girando con Vite in locale
        this.isDev = import.meta.env.DEV;
        // Nonce per l'autenticazione
        this.nonce = window.scrivaniaPusherConfig?.nonce ||
            window.wpApiSettings?.nonce || '';

        // Endpoint base per le API REST
        this.baseUrl = '/wp-json/scrivania/v1';
    }

    /**
     * Ottiene i dati della sessione in base al token
     * @param {string} token - Token della sessione
     * @returns {Promise} Promise con i dati della sessione
     */
    async getSessionData(token) {
        if (this.isDev) {
            return { success: true, session_id: 'dev-session', is_admin: true, carte: [] };
        }
        try {
            const response = await fetch(`${this.baseUrl}/get-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': this.nonce
                },
                credentials: 'include',
                body: JSON.stringify({ token })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Errore durante il recupero della sessione');
            }

            return await response.json();
        } catch (error) {
            console.error('Errore API getSessionData:', error);
            throw error;
        }
    }

    /**
     * Salva lo stato della sessione
     * @param {number} sessionId - ID della sessione
     * @param {Object} sessione - Dati di configurazione della sessione
     * @param {Array} carte - Array delle carte sulla plancia
     * @returns {Promise} Promise con la risposta
     */
    async saveSessionData(sessionId, sessione, carte) {
        if (this.isDev) {
            return { success: true, session_id: 'dev-session', is_admin: true, carte: [] };
        }
        try {
            const response = await fetch(`${this.baseUrl}/save-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': this.nonce
                },
                credentials: 'include',
                body: JSON.stringify({
                    session_id: sessionId,
                    sessione,
                    carte
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Errore durante il salvataggio della sessione');
            }

            return await response.json();
        } catch (error) {
            console.error('Errore API saveSessionData:', error);
            throw error;
        }
    }

    /**
     * Crea una nuova sessione
     * @param {string} nome - Nome della sessione
     * @returns {Promise} Promise con i dati della nuova sessione
     */
    async createSession(nome = 'Nuova Sessione') {
        try {
            const response = await fetch(`${this.baseUrl}/create-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': this.nonce
                },
                credentials: 'include',
                body: JSON.stringify({ nome })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Errore durante la creazione della sessione');
            }

            return await response.json();
        } catch (error) {
            console.error('Errore API createSession:', error);
            throw error;
        }
    }

    /**
     * Recupera i dati di sessione dal DOM o URL
     * @returns {Object} Dati sessione (token, userId, userName, sessionId)
     */
    getSessionDataFromDom() {
        // Cerca nel container React
        const rootElement = document.getElementById('root');
        if (rootElement && rootElement.dataset) {
            const { token, userId, userName, sessionId } = rootElement.dataset;
            if (token) {
                return { token, userId, userName, sessionId };
            }
        }

        // Cerca nel container della pagina
        const container = document.querySelector('.container[data-token]');
        if (container && container.dataset) {
            const { token, userId, userName, sessionId } = container.dataset;
            if (token) {
                return { token, userId, userName, sessionId };
            }
        }

        // Fallback: cerca nell'URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            return { token };
        }

        return null;
    }

    /**
     * Recupera e processa i dati di sessione
     * @returns {Promise} Promise con i dati completi della sessione
     */
    async loadSessionData() {
        // Prima recupera i dati base
        const basicData = this.getSessionDataFromDom();

        /* if (!basicData || !basicData.token) {
            throw new Error('Nessun token trovato');
        } */
        // ➜ Siamo in dev e non c’è un token?  Restituiamo una sessione mock
        if ((!basicData || !basicData.token) && this.isDev) {
            console.warn('[ApiService] Dev-mode: generata sessione mock');
            return {
                sessionId: 'dev-session',
                userId: 1,
                isAdmin: true,
                sessione: {
                    titolo: 'Sessione di sviluppo',
                    creato_il: new Date().toISOString()
                },
                carte: []          // vuoto: ci penserà useCardsManager
            };
        }

        if (!basicData || !basicData.token) {
            throw new Error('Nessun token trovato');
        }


        try {
            // Poi ottieni i dati completi dall'API
            const fullData = await this.getSessionData(basicData.token);

            if (!fullData || !fullData.success) {
                throw new Error('Errore nel caricamento dei dati della sessione');
            }

            // Combina i dati
            return {
                token: basicData.token,
                userId: fullData.user_id,
                userName: fullData.user_name,
                sessionId: fullData.session_id,
                isAdmin: fullData.is_admin,
                sessione: fullData.sessione,
                carte: fullData.carte || []
            };
        } catch (error) {
            console.error('Errore nel caricamento dei dati della sessione:', error);
            throw error;
        }
    }
}

// Esporta una singola istanza del servizio
const apiService = new ApiService();
export default apiService;