import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animate = true
}) => {
  const variantClasses = {
    text: 'rounded-sm',
    rectangular: 'rounded-sm',
    circular: 'rounded-full'
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : '100%')
  };

  return (
    <div
      className={`skeleton ${animate ? '' : ''} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

export default Skeleton;
