import { useState, useRef, useCallback } from 'react';

export const usePlanciaNavigation = () => {
  const [planciaZoom, setPlanciaZoom] = useState(1);
  const [planciaPosition, setPlanciaPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartPosition = useRef({ x: 0, y: 0 });
  const panStartMousePosition = useRef({ x: 0, y: 0 });

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
        setPlanciaPosition({
          x: panStartPosition.current.x + deltaX,
          y: panStartPosition.current.y + deltaY,
        });
      }
    }
  }, [isPanning]);

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
    setPlanciaPosition({ x: newX, y: newY });
  }, [planciaZoom, planciaPosition]);

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