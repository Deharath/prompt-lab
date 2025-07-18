import { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
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
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background transform hover:scale-[1.02] active:scale-[0.98]';

  const variantClasses = {
    primary: isDisabled
      ? 'bg-muted text-foreground/50 cursor-not-allowed transform-none'
      : 'bg-primary text-white hover:bg-primary/90 active:bg-primary/95 shadow-md hover:shadow-lg',
    secondary: isDisabled
      ? 'border border-border bg-card text-foreground/50 cursor-not-allowed transform-none'
      : 'border border-primary bg-transparent text-primary hover:bg-primary/10 active:bg-primary/20',
    ghost: isDisabled
      ? 'text-foreground/50 cursor-not-allowed transform-none'
      : 'text-foreground/70 hover:text-foreground hover:bg-muted/50 active:bg-muted/70',
    danger: isDisabled
      ? 'bg-muted text-foreground/50 cursor-not-allowed transform-none'
      : 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-md hover:shadow-lg',
    success: isDisabled
      ? 'bg-muted text-foreground/50 cursor-not-allowed transform-none'
      : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-md hover:shadow-lg',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm gap-1',
    md: 'px-4 py-3 text-base gap-2',
    lg: 'px-6 py-4 text-lg gap-3',
  };

  return (
    <button
      disabled={isDisabled}
      className={` ${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className} `}
      {...props}
    >
      {loading ? (
        <>
          <div className="flex gap-1" role="status" aria-label="Loading">
            <div
              className="h-2 w-2 animate-pulse rounded-full bg-current"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="h-2 w-2 animate-pulse rounded-full bg-current"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="h-2 w-2 animate-pulse rounded-full bg-current"
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
