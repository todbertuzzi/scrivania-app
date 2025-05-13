import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', size = 'base' }) => {
  const baseStyle = 'rounded px-4 py-2 font-medium';
  const variantStyle = variant === 'secondary'
    ? 'bg-gray-300 text-black'
    : 'bg-blue-600 text-white';
  const sizeStyle = size === 'sm' ? 'text-sm py-1 px-2' : 'text-base';

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variantStyle} ${sizeStyle} hover:opacity-90 transition`}
    >
      {children}
    </button>
  );
};
