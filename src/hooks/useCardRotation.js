import { useRef, useCallback } from 'react';

export const useCardRotation = (onRuota) => {
  const rotazioneInCorso = useRef(false);
  const rotazioneInfo = useRef({
    attiva: false,
    cartaId: null,
    startCardAngle: 0,
    startMouseAngle: 0,
    centerX: 0,
    centerY: 0,
    lastDeltaAngle: 0,
    ultimoAngolo: 0,
    lastUpdateTime: 0,
  });

  const startRotation = useCallback((e, cartaId, currentAngle, cardElement) => {
    e.stopPropagation();
    e.preventDefault();

    rotazioneInCorso.current = true;

    let centerX, centerY;
    if (cardElement) {
      const rect = cardElement.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
    } else {
      const cartaDiv = e.currentTarget.closest(".absolute");
      const rect = cartaDiv.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
    }

    const startMouseAngle = (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;

    rotazioneInfo.current = {
      attiva: true,
      cartaId,
      startCardAngle: currentAngle || 0,
      startMouseAngle,
      centerX,
      centerY,
      lastDeltaAngle: 0,
      ultimoAngolo: currentAngle || 0,
      lastUpdateTime: Date.now(),
    };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!rotazioneInfo.current.attiva) return;

    const now = Date.now();
    if (now - rotazioneInfo.current.lastUpdateTime < 16) return;

    const {
      cartaId,
      startCardAngle,
      startMouseAngle,
      centerX,
      centerY,
      lastDeltaAngle = 0,
    } = rotazioneInfo.current;

    const currentMouseAngle = (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;

    let angleDiff = currentMouseAngle - startMouseAngle;

    if (angleDiff - lastDeltaAngle > 180) {
      angleDiff -= 360;
    } else if (angleDiff - lastDeltaAngle < -180) {
      angleDiff += 360;
    }

    rotazioneInfo.current.lastDeltaAngle = angleDiff;
    const newAngle = startCardAngle + angleDiff;

    if (Math.abs(newAngle - rotazioneInfo.current.ultimoAngolo) < 0.2) return;

    rotazioneInfo.current.ultimoAngolo = newAngle;
    rotazioneInfo.current.lastUpdateTime = now;

    onRuota(cartaId, newAngle);
  }, [onRuota]);

  const stopRotation = useCallback(() => {
    rotazioneInfo.current.attiva = false;
    rotazioneInCorso.current = false;
  }, []);

  return {
    rotazioneInCorso,
    startRotation,
    handleMouseMove,
    stopRotation,
  };
};