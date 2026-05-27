import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  height?: string | number;
  width?: string | number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'rectangular', height, width, className, ...props }, ref) => {
    const baseClass = 'bg-slate-200 animate-pulse';
    const variants = {
      text: 'rounded h-4 w-full',
      circular: 'rounded-full',
      rectangular: 'rounded-lg',
    };

    const style = {
      ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
      ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    };

    return (
      <div
        ref={ref}
        className={`${baseClass} ${variants[variant]} ${className || ''}`}
        style={style}
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

export { Skeleton };
