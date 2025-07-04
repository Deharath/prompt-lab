# AppSidebar Architecture Documentation

## Overview

The AppSidebar is a **unified sidebar component** with three tabs: History, Configuration, and Custom. This document describes the comprehensive refactor that ensures the sidebar is modular, maintainable, and follows idiomatic React patterns.

## Component Structure

### Main Component

- **`AppSidebar/index.tsx`** - The main unified sidebar component that renders all three tabs

### Subcomponents

- **`SidebarHeader.tsx`** - Header with title, collapse button, and tab navigation
- **`HistoryTab.tsx`** - Tab for job history and comparison functionality
- **`ConfigurationTab.tsx`** - Tab for model and evaluation configuration
- **`CollapsedSidebar.tsx`** - Minimized sidebar view when collapsed
- **`DeleteConfirmationModal.tsx`** - Modal for confirming job deletions
- **`RunEvaluationFooter.tsx`** - Footer with evaluation controls and token summary
- **`JobListItem.tsx`** - Individual job item in the history list

### Logic & State Management

- **`useAppSidebar.ts`** - Custom hook containing all sidebar business logic
- **`types.ts`** - TypeScript type definitions for the sidebar
- **`utils.ts`** - Utility functions for formatting and display logic

## Key Features

### Three Unified Tabs

1. **History Tab** - Job history with comparison mode
2. **Configuration Tab** - Model selection and evaluation parameters
3. **Custom Tab** - Custom prompt templates

### Functionality

- Keyboard navigation for job list (arrow keys, enter, delete, escape)
- Real-time job history updates with TanStack Query
- Job comparison mode for comparing two evaluations
- Optimistic updates for delete operations
- Accessibility features with proper ARIA labels

## Architecture Principles

### Separation of Concerns

- **Logic**: All business logic is in the `useAppSidebar` hook
- **UI**: Components are purely presentational
- **State**: Global state managed through job store, local state in hook
- **Types**: All TypeScript interfaces in dedicated types file
- **Utils**: Helper functions for formatting and display

### Component Hierarchy

```
AppSidebar (main component)
├── SidebarHeader (title + tab navigation)
├── Tab Content Container
│   ├── HistoryTab (when activeTab === 'history')
│   ├── ConfigurationTab (when activeTab === 'configuration')
│   └── CustomPrompt (when activeTab === 'custom')
├── RunEvaluationFooter (always visible)
└── DeleteConfirmationModal (conditional)
```

### State Management

- **TanStack Query**: Job history data with automatic refresh
- **Job Store (Zustand)**: Global application state
- **Local State**: Tab navigation, comparison mode, focused items
- **Optimistic Updates**: Immediate UI updates with rollback on error

## Benefits of This Architecture

### Maintainability

- Single sidebar component eliminates confusion
- Clear separation between logic and presentation
- Modular subcomponents for easy testing and modification
- Comprehensive TypeScript typing

### Scalability

- Easy to add new tabs by extending the `TabType` union
- Reusable subcomponents for consistent patterns
- Centralized state management in custom hook

### Developer Experience

- Comprehensive JSDoc documentation
- Clear file organization by feature
- Accessible components with proper ARIA support
- Error handling with optimistic updates

## Usage

```tsx
<AppSidebar
  isCollapsed={false}
  onToggle={() => {}}
  onSelectJob={(jobId) => {}}
  onCompareJobs={(baseId, compareId) => {}}
  provider="openai"
  model="gpt-4o-mini"
  onProviderChange={(provider) => {}}
  onModelChange={(model) => {}}
  onLoadTemplate={(template) => {}}
  onRunEvaluation={() => {}}
  canRunEvaluation={true}
  isRunning={false}
  // ... other props
/>
```

## Testing

The sidebar is tested with the `date-formatting.test.tsx` test which verifies:

- Proper rendering of the unified tab structure
- Correct date formatting using date-fns
- Tab navigation functionality
- Job history display

## Migration Notes

- ❌ **Removed**: Separate `HistorySidebar` component (was incorrect architecture)
- ✅ **Kept**: Single `AppSidebar` with three tabs (correct architecture)
- ✅ **Enhanced**: Better documentation, accessibility, and maintainability
- ✅ **Verified**: All tests pass with the unified structure

This architecture ensures the sidebar is truly unified while maintaining excellent separation of concerns and developer experience.
