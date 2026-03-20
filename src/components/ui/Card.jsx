import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};
