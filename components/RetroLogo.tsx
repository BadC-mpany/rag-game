import React from 'react';

const RetroLogo: React.FC<{ size?: number }> = ({ size = 48 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_6px_16px_rgba(16,185,129,0.12)]">
      <rect x="4" y="4" width="56" height="56" rx="8" stroke="#16A34A" strokeWidth="1.8" fill="rgba(16,24,39,0.6)" />
      <g>
        <path d="M16 40 L24 24 L32 40 Z" fill="#34D399" className="origin-center animate-pulse" />
        <rect x="36" y="20" width="12" height="24" rx="2" fill="#60A5FA" opacity="0.9" />
      </g>
      <text x="8" y="56" fill="#94A3B8" fontSize="6" fontFamily="monospace">badcompany</text>
    </svg>
  );
}

export default RetroLogo;
