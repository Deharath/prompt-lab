import { ReactNode, useState } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

/**
 * Simple tooltip component that shows content on hover
 */
const Tooltip = ({ content, children }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        role="button"
        tabIndex={0}
        aria-label={content}
      >
        {children}
      </div>

      {isVisible && (
        <div
          className="absolute z-10 mt-2 w-64 rounded-md bg-black bg-opacity-90 p-2 text-xs text-white shadow-lg"
          style={{
            transform: 'translateX(-50%)',
            left: '50%',
            top: '100%',
          }}
          role="tooltip"
        >
          <div className="absolute -top-1 left-1/2 -ml-1 h-2 w-2 rotate-45 bg-black bg-opacity-90" />
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
