import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  headerExtra?: React.ReactNode;
  shadowClass?: string;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  headerExtra,
  children,
  className = '',
  shadowClass = 'shadow-[4px_4px_0px_0px_var(--shadow-color)]',
  interactive = false,
  ...props
}) => {
  const baseStyle = 'bg-white border-2 border-primary p-6 relative overflow-hidden transition-all ';
  const hoverStyle = interactive 
    ? 'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] cursor-pointer' 
    : '';

  return (
    <div 
      className={`${baseStyle} ${shadowClass} ${hoverStyle} ${className}`}
      {...props}
    >
      {title && (
        <div className="flex justify-between items-center mb-6 border-b-2 border-primary pb-4">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">{title}</span>
          {headerExtra}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
