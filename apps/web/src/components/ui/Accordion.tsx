import { ReactNode, useState } from 'react';

interface AccordionItemProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  id: string;
}

interface AccordionProps {
  children: ReactNode;
  allowMultiple?: boolean;
}

const AccordionItem = ({
  title,
  children,
  defaultOpen = false,
  id,
}: AccordionItemProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg">
      <button
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-lg"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${id}`}
        id={`accordion-trigger-${id}`}
      >
        <span className="font-medium text-foreground">{title}</span>
        <svg
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div
          className="px-4 pb-4 border-t border-border"
          id={`accordion-content-${id}`}
          role="region"
          aria-labelledby={`accordion-trigger-${id}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

const Accordion = ({ children }: AccordionProps) => {
  return <div className="space-y-2">{children}</div>;
};

export { Accordion, AccordionItem };
