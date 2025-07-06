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
      className={`rounded-lg border border-gray-200 bg-white shadow-sm transition-colors duration-200 dark:border-gray-600 dark:bg-gray-800 ${className}`}
    >
      {title && (
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-600">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      )}
      <div className="p-0">{children}</div>
    </div>
  );
};

export default Card;
