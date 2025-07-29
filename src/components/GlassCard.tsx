import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'light' | 'dark';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  hover = false,
  padding = 'md',
  animate = false,
}) => {
  const baseClasses = 'backdrop-blur-xl rounded-2xl transition-all duration-300 relative overflow-hidden';
  
  const variantClasses = {
    default: 'bg-glass-lighter border border-glass-border',
    light: 'bg-glass-lightest border border-glass-border',
    dark: 'bg-glass-light border border-white/5',
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const shadowClasses = {
    default: 'shadow-[0_8px_32px_rgba(0,0,0,0.12)] shadow-[inset_0_2px_1px_rgba(255,255,255,0.08)]',
    light: 'shadow-[0_4px_24px_rgba(0,0,0,0.08)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]',
    dark: 'shadow-[0_12px_40px_rgba(0,0,0,0.2)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]',
  };
  
  const hoverClasses = hover
    ? 'hover:bg-glass-light hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:shadow-[inset_0_2px_1px_rgba(255,255,255,0.1)]'
    : '';
    
  const animateClasses = animate ? 'animate-fade-in' : '';
  
  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${shadowClasses[variant]}
        ${hoverClasses}
        ${animateClasses}
        ${className}
      `}
    >
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.08), transparent 50%)'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GlassCard;