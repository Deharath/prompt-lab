/**
 * Keyboard shortcuts configuration for the application
 */
export const KEYBOARD_SHORTCUTS = {
  // Core actions
  RUN_EVALUATION: {
    key: 'Enter',
    ctrlKey: true,
    description: 'Run evaluation',
  },
  CANCEL_JOB: {
    key: 'Escape',
    description: 'Cancel running job',
  },

  // Layout and navigation
  TOGGLE_SIDEBAR: {
    key: 'b',
    ctrlKey: true,
    description: 'Toggle sidebar',
  },
  FOCUS_SEARCH: {
    key: 'k',
    ctrlKey: true,
    description: 'Focus search',
  },

  // Sidebar tabs
  HISTORY_TAB: {
    key: '1',
    ctrlKey: true,
    description: 'Go to History tab',
  },
  CONFIG_TAB: {
    key: '2',
    ctrlKey: true,
    description: 'Go to Configuration tab',
  },
  CUSTOM_TAB: {
    key: '3',
    ctrlKey: true,
    description: 'Go to Custom tab',
  },

  // Workspace actions
  CLEAR_WORKSPACE: {
    key: 'n',
    ctrlKey: true,
    shiftKey: true,
    description: 'Clear workspace',
  },

  // Navigation
  NEXT_RESULT: {
    key: 'ArrowRight',
    ctrlKey: true,
    description: 'Next result',
  },
  PREV_RESULT: {
    key: 'ArrowLeft',
    ctrlKey: true,
    description: 'Previous result',
  },

  // Help
  SHOW_SHORTCUTS: {
    key: '?',
    shiftKey: true,
    description: 'Show keyboard shortcuts',
  },
} as const;

/**
 * Shortcut categories for organization
 */
export const SHORTCUT_CATEGORIES = {
  CORE: 'Core Actions',
  NAVIGATION: 'Navigation',
  WORKSPACE: 'Workspace',
  HELP: 'Help',
} as const;

/**
 * Organized shortcuts by category
 */
export const SHORTCUTS_BY_CATEGORY = {
  [SHORTCUT_CATEGORIES.CORE]: [
    KEYBOARD_SHORTCUTS.RUN_EVALUATION,
    KEYBOARD_SHORTCUTS.CANCEL_JOB,
  ],
  [SHORTCUT_CATEGORIES.NAVIGATION]: [
    KEYBOARD_SHORTCUTS.TOGGLE_SIDEBAR,
    KEYBOARD_SHORTCUTS.FOCUS_SEARCH,
    KEYBOARD_SHORTCUTS.HISTORY_TAB,
    KEYBOARD_SHORTCUTS.CONFIG_TAB,
    KEYBOARD_SHORTCUTS.CUSTOM_TAB,
    KEYBOARD_SHORTCUTS.NEXT_RESULT,
    KEYBOARD_SHORTCUTS.PREV_RESULT,
  ],
  [SHORTCUT_CATEGORIES.WORKSPACE]: [KEYBOARD_SHORTCUTS.CLEAR_WORKSPACE],
  [SHORTCUT_CATEGORIES.HELP]: [KEYBOARD_SHORTCUTS.SHOW_SHORTCUTS],
} as const;
