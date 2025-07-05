import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export const DiffHeader = ({ baseJobId, compareJobId, onClose }) => (
  <Card>
    <div className="flex items-center justify-between p-4">
      <div>
        <h2
          className="text-foreground text-lg font-semibold"
          id="comparison-title"
        >
          Job Comparison
        </h2>
        <p
          className="text-muted-foreground text-sm"
          aria-describedby="comparison-title"
        >
          Comparing Job #{baseJobId.substring(0, 8)} vs Job #
          {compareJobId.substring(0, 8)}
        </p>
      </div>
      <Button
        onClick={onClose}
        variant="ghost"
        size="sm"
        aria-label="Close job comparison"
      >
        <svg
          className="mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        Close
      </Button>
    </div>
  </Card>
);
