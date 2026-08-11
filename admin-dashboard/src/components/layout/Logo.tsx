import React from 'react';

interface LogoProps {
  collapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ collapsed = false, size = 'md' }) => {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 36 : 32;

  return (
    <div className="flex items-center gap-2.5 select-none shrink-0">
      {/* Simple, Clean Static Logo Emblem */}
      <div 
        style={{ width: iconSize, height: iconSize }}
        className="bg-[#1C1C1C] dark:bg-slate-800 text-white rounded-xl flex items-center justify-center font-extrabold text-xs shadow-2xs shrink-0 border border-transparent dark:border-slate-700"
      >
        <svg
          width={iconSize * 0.55}
          height={iconSize * 0.55}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Simple Clean Chef / Wheat / Flame Emblem */}
          <path d="M6 13.8A6 6 0 0 1 12 4a6 6 0 0 1 6 9.8" />
          <path d="M6 17h12" />
          <path d="M8 21h8" />
        </svg>
      </div>

      {/* Clean Brand Text */}
      {!collapsed && (
        <div className="flex flex-col">
          <span className="font-bold text-sm text-[#1C1C1C] dark:text-white tracking-tight leading-tight">
            Gemini Food
          </span>
          <span className="text-[10px] font-medium text-[#8C8C8C] dark:text-slate-400">
            Enterprise ERP
          </span>
        </div>
      )}
    </div>
  );
};
