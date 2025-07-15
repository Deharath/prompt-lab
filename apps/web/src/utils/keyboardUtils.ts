import type { KeyboardShortcut } from '../hooks/useKeyboardShortcuts.js';

/**
 * Utility functions for keyboard shortcuts
 */

/**
 * Check if the current platform is Mac
 */
export function isMac(): boolean {
  return typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
}

/**
 * Format a keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey) {
    parts.push(isMac() ? '⌘' : 'Ctrl');
  }
  if (shortcut.altKey) {
    parts.push(isMac() ? '⌥' : 'Alt');
  }
  if (shortcut.shiftKey) {
    parts.push('⇧');
  }
  if (shortcut.metaKey) {
    parts.push('⌘');
  }

  // Format special keys
  let keyDisplay = shortcut.key;
  switch (shortcut.key) {
    case 'Enter':
      keyDisplay = '↵';
      break;
    case 'Escape':
      keyDisplay = 'Esc';
      break;
    case 'ArrowUp':
      keyDisplay = '↑';
      break;
    case 'ArrowDown':
      keyDisplay = '↓';
      break;
    case 'ArrowLeft':
      keyDisplay = '←';
      break;
    case 'ArrowRight':
      keyDisplay = '→';
      break;
    case ' ':
      keyDisplay = 'Space';
      break;
    default:
      keyDisplay = shortcut.key.toUpperCase();
  }

  parts.push(keyDisplay);

  return parts.join('+');
}

/**
 * Check if an element is a text input where we should not trigger shortcuts
 */
export function isTextInput(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();
  const type = (element as HTMLInputElement).type?.toLowerCase();

  return (
    (tagName === 'input' &&
      (!type ||
        ['text', 'password', 'email', 'search', 'tel', 'url'].includes(
          type,
        ))) ||
    tagName === 'textarea' ||
    element.contentEditable === 'true'
  );
}

/**
 * Check if a shortcut should be allowed in text inputs
 */
export function isAllowedInTextInput(shortcut: KeyboardShortcut): boolean {
  // Allow Ctrl+Enter for running evaluations even in text inputs
  return !!shortcut.ctrlKey && shortcut.key === 'Enter';
}

/**
 * Get the modifier key name for the current platform
 */
export function getModifierKeyName(): string {
  return isMac() ? 'Cmd' : 'Ctrl';
}

/**
 * Create a keyboard shortcut object from configuration
 */
export function createShortcut(
  config: {
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
    description: string;
  },
  action: () => void,
  condition?: () => boolean,
): KeyboardShortcut {
  return {
    key: config.key,
    ctrlKey: config.ctrlKey,
    altKey: config.altKey,
    shiftKey: config.shiftKey,
    metaKey: config.metaKey,
    description: config.description,
    action,
    condition,
  };
}

/**
 * Focus the first focusable element in a container
 */
export function focusFirstElement(container: HTMLElement): void {
  const focusable = container.querySelector<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );

  if (focusable) {
    focusable.focus();
  }
}

/**
 * Create a debounced function for keyboard shortcuts
 */
export function debounceShortcut<T extends (...args: any[]) => void>(
  func: T,
  delay: number = 100,
): T {
  let timeoutId: ReturnType<typeof setTimeout>;

  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}
