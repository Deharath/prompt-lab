import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  gradient?: 'blue' | 'purple' | 'green' | 'amber' | 'default';
  className?: string;
  id?: string;
}

const Card = ({
  children,
  gradient = 'default',
  className = '',
  id,
}: CardProps) => {
  const gradientClasses = {
    blue: 'from-blue-50/50 via-purple-50/30 to-indigo-50/50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-indigo-900/20',
    purple:
      'from-purple-50/50 via-pink-50/30 to-rose-50/50 dark:from-purple-900/20 dark:via-pink-900/10 dark:to-rose-900/20',
    green:
      'from-green-50/50 via-emerald-50/30 to-teal-50/50 dark:from-green-900/20 dark:via-emerald-900/10 dark:to-teal-900/20',
    amber:
      'from-amber-50/50 via-yellow-50/30 to-orange-50/50 dark:from-amber-900/20 dark:via-yellow-900/10 dark:to-orange-900/20',
    default:
      'from-gray-50/50 via-slate-50/30 to-gray-50/50 dark:from-gray-900/20 dark:via-slate-900/10 dark:to-gray-900/20',
  };

  return (
    <div
      id={id}
      className={`relative overflow-hidden rounded-2xl backdrop-blur-sm shadow-xl ring-1 transition-colors duration-300 bg-white/80 dark:bg-gray-800/80 ring-gray-200/50 dark:ring-gray-700/50 ${className}`}
    >
      <div
        className={`absolute inset-0 transition-colors duration-300 bg-gradient-to-br ${gradientClasses[gradient]}`}
      ></div>
      <div className="relative">{children}</div>
    </div>
  );
};

export default Card;
