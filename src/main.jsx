/**
 * Punto di ingresso principale dell'applicazione
 * Versione refactored con gestione migliorata del montaggio React
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

/**
 * Assicura che esista l'elemento root per il montaggio React
 * @returns {HTMLElement} L'elemento root
 */
function ensureRootElement() {
  // Prima cerca l'elemento con ID "react-tool-root" (standard WordPress)
  let container = document.getElementById("react-tool-root");
  
  // Se non esiste, cerca "root" (standard sviluppo locale)
  if (!container) {
    container = document.getElementById("root");
  }

  // Se ancora non esiste, crea un nuovo elemento
  if (!container) {
    console.log("Elemento root non trovato, creazione automatica...");

    // Crea nuovo elemento
    container = document.createElement("div");
    container.id = "root";
    container.className = "scrivania-container";

    // Cerca di ottenere dati dal contenitore principale
    const dataContainer = document.querySelector('.container[data-token]');
    if (dataContainer) {
      // Copia tutti i data attributes dal contenitore
      Array.from(dataContainer.attributes).forEach((attr) => {
        if (attr.name.startsWith("data-")) {
          container.setAttribute(attr.name, attr.value);
        }
      });
      console.log("Dati copiati dal contenitore:", {
        token: container.dataset.token,
        userId: container.dataset.userId,
        userName: container.dataset.userName,
        sessionId: container.dataset.sessionId,
      });
    } else {
      // Fallback: cerca token dall'URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (token) {
        console.log("Token trovato nell'URL:", token);
        container.dataset.token = token;
      }
    }

    // Nascondi il messaggio di caricamento WordPress
    const loadingElement = document.querySelector(".loading-message");
    if (loadingElement) {
      loadingElement.style.display = "none";
    }

    // Aggiungi stili base
    container.style.width = "100%";
    container.style.height = "calc(100vh - 120px)";
    container.style.minHeight = "600px";
    container.style.border = "1px solid #ddd";
    container.style.backgroundColor = "#f9f9f9";
    container.style.position = "relative";

    // Aggiungi al DOM
    const targetContainer =
      document.querySelector(".container") ||
      document.querySelector("main") ||
      document.body;
      
    // Se c'è un elemento "loading-message", sostituiscilo con il root
    const loadingMessage = document.querySelector(".loading-message");
    if (loadingMessage && loadingMessage.parentNode) {
      loadingMessage.parentNode.replaceChild(container, loadingMessage);
    } else {
      // Altrimenti, aggiungi all'inizio del contenitore target
      targetContainer.prepend(container);
    }

    console.log("Elemento root creato e aggiunto al DOM");
  }

  return container;
}

/**
 * Monta l'applicazione React nel DOM
 */
function mountReact() {
  try {
    console.log("Montaggio React in corso...");

    // Assicura che l'elemento root esista
    const container = ensureRootElement();

    // Crea la root React
    const root = createRoot(container);

    // Render dell'app con StrictMode
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    console.log("App React montata con successo!");
  } catch (error) {
    console.error("Errore durante il montaggio React:", error);
  }
}

/**
 * Tenta il montaggio con ripetizione in caso di errore
 * @param {number} retries - Numero di tentativi effettuati
 */
function attemptMount(retries = 0) {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 1000; // 1 secondo tra i tentativi

  if (retries >= MAX_RETRIES) {
    console.error(`Impossibile montare React dopo ${MAX_RETRIES} tentativi`);
    
    // Mostra messaggio di errore nel DOM
    const container = document.querySelector(".container") || document.body;
    const errorEl = document.createElement("div");
    errorEl.className = "error-message";
    errorEl.innerHTML = `
      <div style="padding: 20px; background-color: #fff3f3; color: #d32f2f; border: 1px solid #d32f2f; border-radius: 4px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Errore di caricamento</h3>
        <p>Impossibile caricare l'applicazione Scrivania. Ricarica la pagina per riprovare.</p>
        <button onclick="window.location.reload()" style="background: #d32f2f; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          Ricarica
        </button>
      </div>
    `;
    container.prepend(errorEl);
    return;
  }

  try {
    mountReact();
  } catch (error) {
    console.warn(
      `Tentativo ${retries + 1} fallito, riprova in ${RETRY_DELAY}ms...`,
      error
    );
    setTimeout(() => attemptMount(retries + 1), RETRY_DELAY);
  }
}

// Funzione principale di avvio
function initApp() {
  // Assicurati che il DOM sia caricato
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    console.log("DOM già caricato, montaggio immediato");
    attemptMount();
  } else {
    // Altrimenti, aspetta il caricamento DOM
    console.log("In attesa del caricamento DOM...");
    document.addEventListener("DOMContentLoaded", () => attemptMount());
  }

  // Backup: riprova anche dopo il caricamento completo
  window.addEventListener("load", () => {
    console.log("Evento load attivato, controllo montaggio React");

    // Controlla se l'app è già montata
    const rootEl = document.getElementById("root") || document.getElementById("react-tool-root");
    const reactApp = rootEl && rootEl.children.length > 0;
    
    if (!reactApp) {
      console.log("App React non trovata dopo load, nuovo tentativo...");
      attemptMount();
    }
  });
}

// Avvia l'applicazione
initApp();