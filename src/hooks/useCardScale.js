import { useRef, useCallback } from 'react';

export const useCardScale = (onScala) => {
  const scalaInCorso = useRef(false);
  const scalaInfo = useRef({
    attiva: false,
    cartaId: null,
    startScale: 1.0,
    startMouseY: 0,
    lastUpdateTime: 0,
    ultimaScala: 1.0,
    sensibilita: 0.01,
  });

  const startScale = useCallback((e, cartaId, currentScale) => {
    e.stopPropagation();
    e.preventDefault();

    scalaInCorso.current = true;

    scalaInfo.current = {
      attiva: true,
      cartaId,
      startScale: currentScale || 1.0,
      startMouseY: e.clientY,
      lastUpdateTime: Date.now(),
      ultimaScala: currentScale || 1.0,
      sensibilita: 0.01,
    };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!scalaInfo.current.attiva) return;

    const now = Date.now();
    if (now - scalaInfo.current.lastUpdateTime < 16) return;

    const { cartaId, startScale, startMouseY, sensibilita } = scalaInfo.current;

    const deltaY = startMouseY - e.clientY;
    let newScale = startScale + deltaY * sensibilita;

    newScale = Math.max(0.5, Math.min(3.0, newScale));
    newScale = Math.round(newScale * 100) / 100;

    if (newScale === scalaInfo.current.ultimaScala) return;

    scalaInfo.current.ultimaScala = newScale;
    scalaInfo.current.lastUpdateTime = now;

    onScala(cartaId, newScale);
  }, [onScala]);

  const stopScale = useCallback(() => {
    scalaInfo.current.attiva = false;
    scalaInCorso.current = false;
  }, []);

  return {
    scalaInCorso,
    startScale,
    handleMouseMove,
    stopScale,
  };
};