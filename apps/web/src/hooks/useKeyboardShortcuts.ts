/**
 * Keyboard shortcuts hook for power users
 * Provides centralized keyboard shortcut management with proper cleanup
 */
import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  condition?: () => boolean;
}

export interface KeyboardShortcutOptions {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  enabled?: boolean;
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: KeyboardShortcutOptions = {},
) {
  const {
    preventDefault = true,
    stopPropagation = false,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Exception: Allow Ctrl+Enter in textareas (for running evaluation)
        if (!(event.ctrlKey && event.key === 'Enter')) {
          return;
        }
      }

      const matchedShortcut = shortcuts.find((shortcut) => {
        const keyMatches =
          shortcut.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatches =
          !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey);
        const altMatches = !!shortcut.altKey === event.altKey;
        const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
        const metaMatches = !!shortcut.metaKey === event.metaKey;

        return (
          keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches
        );
      });

      if (matchedShortcut) {
        // Check condition if provided
        if (matchedShortcut.condition && !matchedShortcut.condition()) {
          return;
        }

        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }

        matchedShortcut.action();
      }
    },
    [shortcuts, preventDefault, stopPropagation, enabled],
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return {
    shortcuts,
    enabled,
  };
}
