import { useState, useRef, useCallback, useEffect } from 'react';

export const usePlanciaNavigation = ({ initialZoom = 1, initialPosition = { x: 0, y: 0 }, onChange } = {}) => {
  const [planciaZoom, setPlanciaZoom] = useState(initialZoom);
  const [planciaPosition, setPlanciaPosition] = useState(initialPosition);
  const [isPanning, setIsPanning] = useState(false);
  const panStartPosition = useRef({ x: 0, y: 0 });
  const panStartMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isPanning) {
      setPlanciaZoom(initialZoom);
      setPlanciaPosition(initialPosition);
    }
  }, [initialZoom, initialPosition, isPanning]);

  const startPanning = useCallback((e) => {
    const isOnPlancia = e.currentTarget === e.target || 
                       e.target.classList.contains("transform-container");

    if (isOnPlancia) {
      e.stopPropagation();
      setIsPanning(true);
      panStartPosition.current = { ...planciaPosition };
      panStartMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  }, [planciaPosition]);

  const handlePanning = useCallback((e) => {
    if (isPanning) {
      const deltaX = e.clientX - panStartMousePosition.current.x;
      const deltaY = e.clientY - panStartMousePosition.current.y;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        const nextPosition = {
          x: panStartPosition.current.x + deltaX,
          y: panStartPosition.current.y + deltaY,
        };
        setPlanciaPosition(nextPosition);
        onChange?.(planciaZoom, nextPosition);
      }
    }
  }, [isPanning, onChange, planciaZoom]);

  const stopPanning = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleZoom = useCallback((e, areaRef) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(3, planciaZoom + delta));

    const rect = areaRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scale = newZoom / planciaZoom;
    const newX = mouseX - (mouseX - planciaPosition.x) * scale;
    const newY = mouseY - (mouseY - planciaPosition.y) * scale;

    setPlanciaZoom(newZoom);
    const nextPosition = { x: newX, y: newY };
    setPlanciaPosition(nextPosition);
    onChange?.(newZoom, nextPosition);
  }, [onChange, planciaZoom, planciaPosition]);

  return {
    planciaZoom,
    planciaPosition,
    isPanning,
    startPanning,
    handlePanning,
    stopPanning,
    handleZoom,
  };
};