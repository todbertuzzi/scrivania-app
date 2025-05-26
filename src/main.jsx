// Versione aggiornata di src/main.jsx con creazione automatica dell'elemento root

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Funzione per garantire l'esistenza dell'elemento root
function ensureRootElement() {
  let container = document.getElementById("root");

  // Se l'elemento non esiste, crealo
  if (!container) {
    console.log("Elemento root non trovato, creazione automatica...");

    // Crea nuovo elemento
    container = document.createElement("div");
    container.id = "root";
    container.className = "scrivania-container";

    // Cerca di ottenere token dall'URL
    /*  const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      console.log("Token trovato nell'URL:", token);
      container.dataset.token = token;
    } */
    const dataContainer = document.querySelector('.container')
    if (dataContainer) {
      // Copia tutti i data attributes dal template
      Array.from(dataContainer.attributes).forEach((attr) => {
        if (attr.name.startsWith("data-")) {
          container.setAttribute(attr.name, attr.value);
        }
      });
      console.log("Dati copiati da react-tool-root:", {
        token: dataContainer.dataset.token,
        userId: dataContainer.dataset.userId,
        userName: dataContainer.dataset.userName,
        sessionId: dataContainer.dataset.sessionId,
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

    // Aggiungi stili e attributi
    container.style.width = "100%";
    container.style.minHeight = "600px";
    container.style.border = "1px solid #ddd";
    container.style.backgroundColor = "#f9f9f9";
    container.style.padding = "20px";
    container.style.margin = "20px 0";

    // Aggiungi al DOM
    const targetContainer =
      document.querySelector(".container") ||
      document.querySelector("main") ||
      document.body;
    targetContainer.prepend(container);

    console.log("Elemento root creato e aggiunto al DOM");
  }

  return container;
}

// Funzione per montare React
function mountReact() {
  try {
    console.log("Tentativo di montaggio React...");

    // Assicurati che l'elemento root esista
    const container = ensureRootElement();

    // Registra eventuali attributi data
    console.log("Root element dataset:", {
      token: container.dataset.token,
      userId: container.dataset.userId,
      userName: container.dataset.userName,
    });

    // Crea la root React
    const root = createRoot(container);

    // Render dell'app
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    const loadingElement = document.getElementById("scrivania-loading");
    if (loadingElement) {
      loadingElement.style.display = "none";
      console.log("Loading message nascosto");
    }

    console.log("App React montata con successo!");
  } catch (error) {
    console.error("Errore durante il montaggio React:", error);
  }
}

// Funzione per riprovare il montaggio
function attemptMount(retries = 0) {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 1000; // 1 secondo tra i tentativi

  if (retries >= MAX_RETRIES) {
    console.error(`Impossibile montare React dopo ${MAX_RETRIES} tentativi`);
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

// Se il DOM è già caricato, monta subito
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  console.log("DOM già caricato, montaggio immediato");
  setTimeout(attemptMount, 100); // Piccolo timeout per assicurarsi che il DOM sia pronto
} else {
  // Altrimenti, aspetta il caricamento DOM
  console.log("In attesa del caricamento DOM...");
  document.addEventListener("DOMContentLoaded", () =>
    setTimeout(attemptMount, 100)
  );
}

// Backup: riprova anche dopo il caricamento completo
window.addEventListener("load", () => {
  console.log("Evento load attivato, controllo montaggio React");

  // Controlla se l'app è già montata
  const reactApp = document.querySelector("#root > *");
  if (!reactApp) {
    console.log("App React non trovata dopo load, nuovo tentativo...");
    setTimeout(attemptMount, 200);
  }
});
