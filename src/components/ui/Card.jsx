import React from 'react';

export const Card = ({ angle = 0, children, className = '' }) => {
  return (
    <div
      className={className}
      style={{
        transform: `rotate(${angle}deg)`,
        transition: 'transform 0.05s linear'
      }}
    >
      {children}
    </div>
  );
};
