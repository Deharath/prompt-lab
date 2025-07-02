import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

const Card = ({ title, children, className = '', id }: CardProps) => {
  return (
    <div
      id={id}
      className={`bg-card border border-border rounded-lg shadow-sm transition-colors duration-200 ${className}`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export default Card;
