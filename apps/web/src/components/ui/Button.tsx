import { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
}

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) => {
  const isDisabled = loading || disabled;

  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  const variantClasses = {
    primary: isDisabled
      ? 'bg-muted text-foreground/50 cursor-not-allowed'
      : 'bg-primary text-white hover:bg-primary/90 active:bg-primary/95 shadow-md hover:shadow-lg',
    secondary: isDisabled
      ? 'border border-border bg-card text-foreground/50 cursor-not-allowed'
      : 'border border-primary bg-transparent text-primary hover:bg-primary/10 active:bg-primary/20',
    ghost: isDisabled
      ? 'text-foreground/50 cursor-not-allowed'
      : 'text-foreground/70 hover:text-foreground hover:bg-muted/50 active:bg-muted/70',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm gap-1',
    md: 'px-4 py-3 text-base gap-2',
    lg: 'px-6 py-4 text-lg gap-3',
  };

  return (
    <button
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <div className="flex gap-1">
            <div
              className="w-2 h-2 bg-current rounded-full animate-pulse"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2 h-2 bg-current rounded-full animate-pulse"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-2 h-2 bg-current rounded-full animate-pulse"
              style={{ animationDelay: '300ms' }}
            />
          </div>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;
