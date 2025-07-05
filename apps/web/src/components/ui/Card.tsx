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
      className={`bg-card border-border rounded-lg border shadow-sm transition-colors duration-200 ${className}`}
    >
      {title && (
        <div className="border-border border-b px-6 py-4">
          <h3 className="text-foreground text-lg font-semibold">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export default Card;
