import React from 'react';
import { cn } from '../utils';
import { useStore } from '../store';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showSubtitle = false, 
  theme = 'auto',
  className 
}) => {
  const { state } = useStore();
  
  const isDark = theme === 'auto' 
    ? state.themeMode === 'dark'
    : theme === 'dark';

  const sizeConfig = {
    sm: { icon: 'w-6 h-6', title: 'text-base', subtitle: 'text-[8px]' },
    md: { icon: 'w-8 h-8', title: 'text-lg', subtitle: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', title: 'text-2xl', subtitle: 'text-xs' },
  };

  const config = sizeConfig[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative flex items-center justify-center", config.icon)}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#38bdf8', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#2dd4bf', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <rect x="10" y="10" width="80" height="80" rx="22" fill="url(#logoGradient)" />
          <path 
            d="M35 38 V62 H52 M48 38 H65 V62" 
            stroke="white" 
            strokeWidth="7" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      <div className="flex flex-col">
        <span className={cn(
          "font-bold tracking-tight leading-tight",
          config.title,
          isDark ? 'text-white' : 'text-slate-800'
        )}>
          兰途工具箱
        </span>
        {showSubtitle && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn(
              "h-[1.5px] w-3",
              isDark ? 'bg-blue-400/50' : 'bg-slate-300'
            )}></span>
            <span className={cn(
              "font-bold tracking-[0.25em] uppercase",
              config.subtitle,
              isDark ? 'text-blue-400' : 'text-slate-400'
            )}>
              LT Toolbox Pro
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const LogoIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg viewBox="0 0 100 100" className={className} width={size} height={size}>
    <defs>
      <linearGradient id="logoIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#38bdf8', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#2dd4bf', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <rect x="10" y="10" width="80" height="80" rx="22" fill="url(#logoIconGradient)" />
    <path 
      d="M35 38 V62 H52 M48 38 H65 V62" 
      stroke="white" 
      strokeWidth="7" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);
