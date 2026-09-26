import React from 'react';

export const CiiLogo: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ className = '', size = 'md' }) => {
  const dimensions = {
    xs: 'h-7 w-7',
    sm: 'h-8 w-8',
    md: 'h-9.5 w-9.5',
    lg: 'h-14 w-14'
  };

  return (
    <div className={`flex items-center shrink-0 ${dimensions[size]} ${className}`}>
      <svg 
        viewBox="0 0 500 500" 
        className="w-full h-full object-contain rounded-xl shadow-none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Solid deep forest green background matching the brand palette */}
        <rect width="500" height="500" rx="40" fill="#063028" />
        
        {/* White rounded rectangle frame with exact proportions */}
        <rect x="85" y="115" width="330" height="270" rx="40" fill="none" stroke="white" strokeWidth="20" />
        
        {/* "CII" Text styled with a bold serif italic look matching the official typography */}
        <text 
          x="248" 
          y="285" 
          fontFamily="Georgia, 'Times New Roman', serif" 
          fontWeight="900" 
          fontStyle="italic" 
          fontSize="180" 
          fill="white" 
          textAnchor="middle"
          letterSpacing="-4"
        >CII</text>
      </svg>
    </div>
  );
};

