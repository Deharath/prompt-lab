import React from 'react';
import type { DeleteConfirmation } from './types.js';

interface DeleteConfirmationModalProps {
  deleteConfirmation: DeleteConfirmation | null;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  deleteConfirmation,
  onCancel,
  onConfirm,
}) => {
  if (!deleteConfirmation) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border-border mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border shadow-xl">
        <div className="p-6">
          <div className="mb-4 flex items-center space-x-3">
            <div className="bg-destructive/10 flex h-12 w-12 items-center justify-center rounded-full">
              <svg
                className="text-destructive h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-foreground text-lg font-semibold">
                Delete Job #{deleteConfirmation.shortId}
              </h3>
              <p className="text-muted-foreground text-sm">
                This action cannot be undone
              </p>
            </div>
          </div>

          <p className="text-muted-foreground mb-6 text-sm">
            Are you sure you want to delete this job? All associated data
            including results and metrics will be permanently removed.
          </p>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="text-foreground bg-muted hover:bg-muted/80 border-border focus-visible:ring-primary flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90 border-destructive focus-visible:ring-destructive flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2"
            >
              Delete Job
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
