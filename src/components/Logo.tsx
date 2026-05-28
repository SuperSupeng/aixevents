import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'color' | 'white';
}

const Logo: React.FC<LogoProps> = ({ size = 32, className = '', variant = 'color' }) => {
  const src = variant === 'white'
    ? '/brand/datawhale-logo-white.png'
    : '/brand/datawhale-logo-color.png';

  return (
    <img
      src={src}
      alt="Datawhale"
      style={{ height: `${size}px` }}
      className={`w-auto object-contain ${className}`}
      loading="eager"
    />
  );
};

export default Logo;
