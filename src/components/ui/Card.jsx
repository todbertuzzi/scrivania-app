import React from 'react';

export const Card = ({ children, className = '' }) => {
  return (
    <div className={` rounded-lg border border-gray-300 bg-white ${className}`}>
      {children}
    </div>
  );
};
