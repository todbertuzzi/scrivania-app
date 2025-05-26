/**
 * Componente per i controlli di pan e zoom della plancia
 */
import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearchPlus,
  faSearchMinus,
  faSyncAlt,
} from "@fortawesome/free-solid-svg-icons";
import { PLANCIA_CONFIG } from '../../utils/constants';

/**
 * Componente che mostra i controlli per pan e zoom della plancia
 * @param {Object} props - Props del componente
 * @param {number} props.zoom - Livello di zoom corrente
 * @param {Function} props.onZoomIn - Callback per zoom in
 * @param {Function} props.onZoomOut - Callback per zoom out
 * @param {Function} props.onReset - Callback per reset
 */
const PanZoomControls = ({ zoom, onZoomIn, onZoomOut, onReset }) => {
  /**
   * Incrementa lo zoom di un livello
   */
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + PLANCIA_CONFIG.ZOOM_STEP, PLANCIA_CONFIG.MAX_ZOOM);
    onZoomIn(newZoom);
  };

  /**
   * Decrementa lo zoom di un livello
   */
  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - PLANCIA_CONFIG.ZOOM_STEP, PLANCIA_CONFIG.MIN_ZOOM);
    onZoomOut(newZoom);
  };

  return (
    <div className="absolute bottom-3 right-3 bg-white bg-opacity-70 px-2 py-1 rounded text-sm flex items-center">
      {/* Indicatore di zoom */}
      <span className="mr-2">Zoom: {Math.round(zoom * 100)}%</span>
      
      {/* Controlli zoom */}
      <div className="flex space-x-1">
        <button 
          className="bg-gray-200 hover:bg-gray-300 p-1 rounded"
          onClick={handleZoomOut}
          disabled={zoom <= PLANCIA_CONFIG.MIN_ZOOM}
          title="Zoom out"
        >
          <FontAwesomeIcon icon={faSearchMinus} className="text-gray-700" />
        </button>
        
        <button 
          className="bg-gray-200 hover:bg-gray-300 p-1 rounded"
          onClick={handleZoomIn}
          disabled={zoom >= PLANCIA_CONFIG.MAX_ZOOM}
          title="Zoom in"
        >
          <FontAwesomeIcon icon={faSearchPlus} className="text-gray-700" />
        </button>
        
        <button 
          className="bg-gray-200 hover:bg-gray-300 p-1 rounded"
          onClick={onReset}
          title="Reset zoom e posizione"
        >
          <FontAwesomeIcon icon={faSyncAlt} className="text-gray-700" />
        </button>
      </div>
    </div>
  );
};

export default PanZoomControls;