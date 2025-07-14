import React from 'react';
import {
  SHORTCUTS_BY_CATEGORY,
  SHORTCUT_CATEGORIES,
} from '../../constants/shortcuts.js';
import { formatShortcut, createShortcut } from '../../utils/keyboardUtils.js';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal displaying all available keyboard shortcuts organized by category
 */
export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div className="bg-background border-border max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg border shadow-xl">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b p-6">
          <h2 id="shortcuts-modal-title" className="text-xl font-semibold">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
            aria-label="Close shortcuts modal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="space-y-8">
            {Object.entries(SHORTCUTS_BY_CATEGORY).map(
              ([category, shortcuts]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-foreground border-border border-b pb-2 text-lg font-medium">
                    {category}
                  </h3>
                  <div className="grid gap-3">
                    {shortcuts.map((shortcut, index) => {
                      const formattedShortcut = formatShortcut(
                        createShortcut(
                          shortcut,
                          () => {},
                          () => true,
                        ),
                      );
                      return (
                        <div
                          key={index}
                          className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3"
                        >
                          <span className="text-foreground">
                            {shortcut.description}
                          </span>
                          <kbd className="bg-muted text-muted-foreground rounded border px-2 py-1 font-mono text-sm">
                            {formattedShortcut}
                          </kbd>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ),
            )}
          </div>

          {/* Additional tips */}
          <div className="border-border mt-8 border-t pt-6">
            <h3 className="text-foreground mb-4 text-lg font-medium">Tips</h3>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                • Shortcuts work globally except when typing in text fields
              </li>
              <li>• Some shortcuts are only available in specific contexts</li>
              <li>
                • Use Ctrl+Enter to run evaluations even while editing text
              </li>
              <li>
                • Navigate job history with arrow keys when sidebar is focused
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-border flex justify-end border-t p-6">
          <button
            onClick={onClose}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 font-medium transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
