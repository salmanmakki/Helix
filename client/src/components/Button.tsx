import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'flat';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  let baseStyle = 'border-2 border-primary font-label-caps text-label-caps uppercase transition-all duration-75 flex items-center justify-center gap-2 select-none ';
  
  if (variant === 'primary') {
    baseStyle += 'bg-secondary-container text-on-secondary-container font-bold shadow-[4px_4px_0px_0px_var(--shadow-color)] active:translate-x-1 active:translate-y-1 active:shadow-none';
  } else if (variant === 'secondary') {
    baseStyle += 'bg-white text-primary font-bold shadow-[4px_4px_0px_0px_var(--shadow-color)] active:translate-x-1 active:translate-y-1 active:shadow-none';
  } else if (variant === 'danger') {
    baseStyle += 'bg-error-container text-on-error-container font-bold shadow-[4px_4px_0px_0px_var(--shadow-color)] active:translate-x-1 active:translate-y-1 active:shadow-none';
  } else if (variant === 'flat') {
    baseStyle = 'font-label-caps text-label-caps uppercase hover:underline flex items-center gap-2';
  }

  return (
    <button className={`${baseStyle} ${className}`} {...props}>
      {children}
    </button>
  );
};
export default Button;
