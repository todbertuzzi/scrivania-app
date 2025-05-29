/**
 * Componente per il background della plancia
 */
import React from 'react';

/**
 * Componente che renderizza il background della plancia
 * @param {Object} props - Props del componente
 * @param {string} props.pattern - Tipo di pattern da visualizzare ('grid', 'dots', 'none')
 * @param {string} props.backgroundColor - Colore di sfondo
 */
const PlanciaBackground = ({ 
  pattern = 'grid', 
  backgroundColor = '#fafafa' 
}) => {
  // Genera il pattern SVG in base al tipo selezionato
  const generatePattern = () => {
    switch (pattern) {
      case 'grid':
        return (
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="1"
                opacity="0.3"
              />
            </pattern>
          </defs>
        );
      
      case 'dots':
        return (
          <defs>
            <pattern
              id="dots"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="10"
                cy="10"
                r="1"
                fill="#d0d0d0"
                opacity="0.4"
              />
            </pattern>
          </defs>
        );
      
      default:
        return null;
    }
  };

  return (
    <div 
      className="absolute inset-0 plancia-background"
      style={{ 
        backgroundColor,
        backgroundImage: pattern !== 'none' ? `url("data:image/svg+xml,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
            ${pattern === 'grid' ? 
              '<path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="1" opacity="0.3"/>' :
              '<circle cx="10" cy="10" r="1" fill="#d0d0d0" opacity="0.4"/>'
            }
          </svg>
        `)}")` : 'none'
      }}
    >
      {/* Overlay gradiente per migliorare il contrasto */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.02) 100%)'
        }}
      />
    </div>
  );
};

export default PlanciaBackground;