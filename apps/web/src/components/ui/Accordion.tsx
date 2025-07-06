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
    <div className="border-border rounded-lg border">
      <button
        className="hover:bg-muted/50 focus-visible:ring-primary flex w-full items-center justify-between rounded-t-lg px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${id}`}
        id={`accordion-trigger-${id}`}
      >
        <span className="text-foreground font-medium">{title}</span>
        <svg
          className={`text-muted-foreground h-4 w-4 transition-transform duration-200 ${
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
          className="border-border border-t px-4 pb-4"
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
