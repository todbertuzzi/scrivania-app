/**
 * Custom hook per ottimizzare le performance delle carte
 * Implementa virtualizzazione e throttling per migliorare le prestazioni
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

/**
 * Hook per ottimizzare il rendering delle carte
 * @param {Array} carte - Array delle carte
 * @param {Object} viewport - Dimensioni del viewport { width, height }
 * @param {Object} transform - Trasformazioni applicate { zoom, x, y }
 * @returns {Object} Carte ottimizzate e funzioni di utilità
 */
export const useOptimizedCards = (carte, viewport, transform) => {
  // Throttling per aggiornamenti frequenti
  const [throttledTransform, setThrottledTransform] = useState(transform);
  const throttleRef = useRef();

  // Throttle delle trasformazioni per evitare troppi re-render
  useEffect(() => {
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
    }
    
    throttleRef.current = setTimeout(() => {
      setThrottledTransform(transform);
    }, 16); // ~60fps
    
    return () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, [transform]);

  // Calcola le carte visibili nel viewport
  const visibleCards = useMemo(() => {
    if (!viewport || !throttledTransform) return carte;
    
    const { width, height } = viewport;
    const { zoom, x, y } = throttledTransform;
    
    // Margine per il pre-loading delle carte appena fuori dal viewport
    const margin = 200;
    
    // Calcola l'area visibile nel sistema di coordinate delle carte
    const visibleArea = {
      left: (-x - margin) / zoom,
      right: (-x + width + margin) / zoom,
      top: (-y - margin) / zoom,
      bottom: (-y + height + margin) / zoom
    };
    
    return carte.filter(carta => {
      // Dimensioni approssimative di una carta (considera anche scala e rotazione)
      const cardWidth = 120 * (carta.scale || 1);
      const cardHeight = 150 * (carta.scale || 1);
      
      const cardLeft = carta.x - cardWidth / 2;
      const cardRight = carta.x + cardWidth / 2;
      const cardTop = carta.y - cardHeight / 2;
      const cardBottom = carta.y + cardHeight / 2;
      
      // Verifica se la carta interseca l'area visibile
      return !(
        cardRight < visibleArea.left ||
        cardLeft > visibleArea.right ||
        cardBottom < visibleArea.top ||
        cardTop > visibleArea.bottom
      );
    });
  }, [carte, viewport, throttledTransform]);

  // Gruppi di carte per priorità di rendering
  const cardGroups = useMemo(() => {
    const groups = {
      priority: [], // Carte selezionate o in movimento
      visible: [],  // Carte visibili nel viewport
      hidden: []    // Carte fuori dal viewport
    };
    
    carte.forEach(carta => {
      const isVisible = visibleCards.includes(carta);
      const isPriority = carta.isSelected || carta.isDragging;
      
      if (isPriority) {
        groups.priority.push(carta);
      } else if (isVisible) {
        groups.visible.push(carta);
      } else {
        groups.hidden.push(carta);
      }
    });
    
    return groups;
  }, [carte, visibleCards]);

  // Statistiche per debugging
  const stats = useMemo(() => ({
    totalCards: carte.length,
    visibleCards: visibleCards.length,
    priorityCards: cardGroups.priority.length,
    hiddenCards: cardGroups.hidden.length,
    cullingRatio: carte.length > 0 ? (1 - visibleCards.length / carte.length) : 0
  }), [carte.length, visibleCards.length, cardGroups]);

  return {
    visibleCards,
    cardGroups,
    stats,
    isCardVisible: useCallback((cardId) => {
      return visibleCards.some(carta => carta.id === cardId);
    }, [visibleCards])
  };
};

/**
 * Hook per gestire il throttling degli aggiornamenti delle carte
 * @param {Function} updateFunction - Funzione da chiamare per gli aggiornamenti
 * @param {number} delay - Ritardo in ms per il throttling
 * @returns {Function} Funzione throttled
 */
export const useThrottledUpdate = (updateFunction, delay = 16) => {
  const timeoutRef = useRef();
  const lastCallRef = useRef(0);

  return useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;

    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      updateFunction(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        updateFunction(...args);
      }, delay - timeSinceLastCall);
    }
  }, [updateFunction, delay]);
};

/**
 * Hook per gestire il preloading delle immagini delle carte
 * @param {Array} carte - Array delle carte
 * @returns {Object} Stato del preloading
 */
export const useImagePreloader = (carte) => {
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [failedImages, setFailedImages] = useState(new Set());

  useEffect(() => {
    const imageUrls = new Set();
    
    // Raccogli tutti gli URL delle immagini
    carte.forEach(carta => {
      if (carta.img) imageUrls.add(carta.img);
      if (carta.frontImg) imageUrls.add(carta.frontImg);
      if (carta.retro) imageUrls.add(carta.retro);
    });

    // Preload delle immagini
    Array.from(imageUrls).forEach(url => {
      if (!loadedImages.has(url) && !failedImages.has(url)) {
        const img = new Image();
        
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, url]));
        };
        
        img.onerror = () => {
          setFailedImages(prev => new Set([...prev, url]));
        };
        
        img.src = url;
      }
    });
  }, [carte, loadedImages, failedImages]);

  return {
    isImageLoaded: useCallback((url) => loadedImages.has(url), [loadedImages]),
    isImageFailed: useCallback((url) => failedImages.has(url), [failedImages]),
    loadingProgress: carte.length > 0 ? loadedImages.size / carte.length : 1
  };
};

export default useOptimizedCards;