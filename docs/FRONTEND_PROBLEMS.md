# Frontend Organization Analysis

## Current State Analysis (as of July 6, 2025)

### Directory Structure Issues Found

#### 1. **Component Organization Problems**

##### A. Scattered Components in Root `/components`

- Multiple standalone components mixed with directories
- No clear categorization or grouping logic
- Components at different abstraction levels mixed together

**Files in root `/components`:**

- `AppSidebar.tsx` (re-export file)
- `CustomPrompt.tsx`
- `DiffView.tsx`
- `ErrorBoundary.tsx`
- `ErrorMessage.tsx`
- `Header.stories.tsx`
- `HistoryDrawer.tsx`
- `InputEditor.tsx`
- `MetricSelector.tsx`
- `ModelSelector.tsx`
- `ModernLiveOutput.tsx`
- `ParameterSlider.tsx`
- `PromptEditor.tsx`
- `PromptWorkspace.tsx`
- `PromptWorkspace.stories.tsx`
- `QualitySummaryDashboard.tsx`
- `ResultsPanelV2.tsx`
- `RunButton.tsx`
- `RunConfiguration.tsx`
- `ShareRunButton.tsx`
- `TimeRangeSelector.tsx`
- `UnifiedPanel.tsx`
- `UnifiedPanel.stories.tsx`

##### B. Duplicate/Similar Components

1. **Header Components:**
   - `components/layout/Header.tsx` - Generic header
   - `components/layout/HeaderWithTokenSummary.tsx` - Specialized header for Home page
   - **Issue:** Two very similar headers with overlapping functionality

2. **Loading Components:**
   - `components/ui/LoadingState.tsx` - UI loading component
   - `pages/RunViewerPage/LoadingState.tsx` - Page-specific loading component
   - **Issue:** Potential duplication of loading state logic

3. **Results Panel:**
   - `ResultsPanelV2.tsx` - Suggests there was a V1 that might be obsolete
   - **Issue:** Versioned component names indicate tech debt

##### C. Inconsistent Component Placement

1. **Story Files Mixed with Components:**
   - `Header.stories.tsx`, `PromptWorkspace.stories.tsx`, `UnifiedPanel.stories.tsx` scattered in main components directory
   - Should be co-located with their components or in dedicated stories directory

2. **Page Components in Wrong Locations:**
   - Some page-specific components might be in the general components directory

#### 2. **Empty/Redundant Directories**

##### A. Empty Directories

- `components/QualityDashboard/` - Completely empty directory
- **Issue:** Should be removed or populated

##### B. Redundant Structure

- `components/AppSidebar.tsx` is just a re-export of `components/AppSidebar/index.tsx`
- **Issue:** Unnecessary indirection

#### 3. **Naming Convention Issues**

##### A. Inconsistent Naming

- `ResultsPanelV2.tsx` - Version suffix indicates legacy code
- `ModernLiveOutput.tsx` - "Modern" prefix suggests older variants exist
- `QualitySummaryDashboard.tsx` vs `DashboardPage.tsx` - Inconsistent dashboard naming

##### B. Unclear Component Purpose

- `HistoryDrawer.tsx` - Could be more specifically named
- `UnifiedPanel.tsx` - Vague name doesn't indicate functionality

#### 4. **Functional Issues**

##### A. Component Usage Analysis

- `QualitySummaryDashboard.tsx` - No imports found, potentially unused
- `HistoryDrawer.tsx` - Usage unclear
- `InputEditor.tsx` - Usage unclear
- `PromptEditor.tsx` - Usage unclear

##### B. Storybook Organization

- Story files scattered throughout components directory
- No consistent co-location strategy

#### 5. **Missing Organization Patterns**

##### A. No Feature-Based Grouping

- Components not organized by feature/domain
- No clear separation between business logic and UI components

##### B. No Clear Component Hierarchy

- Atomic/molecular/organism pattern not followed
- No distinction between layouts, pages, features, and UI components

#### 6. **Legacy Code Indicators**

##### A. Versioned Components

- `ResultsPanelV2.tsx` indicates multiple versions existed

##### B. "Modern" Prefixes

- `ModernLiveOutput.tsx` suggests older implementation exists

### Recommended Organization Structure

```
src/
├── components/
│   ├── ui/              # Atomic UI components
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── LoadingState/
│   │   └── ...
│   ├── layout/          # Layout components
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── MainLayout/
│   │   └── Footer/
│   ├── features/        # Feature-specific components
│   │   ├── prompt/
│   │   ├── dashboard/
│   │   ├── diff/
│   │   ├── evaluation/
│   │   └── metrics/
│   └── shared/          # Shared business components
├── pages/               # Page components
├── hooks/               # Custom hooks
├── store/               # State management
├── utils/               # Utility functions
├── types/               # Type definitions
└── constants/           # Constants
```

### Unused/Potentially Obsolete Components

Based on usage analysis:

1. `QualitySummaryDashboard.tsx` - No imports found
2. Empty `QualityDashboard/` directory
3. Potentially duplicate story files in `/stories` directory

### Next Steps

1. **Immediate Actions:**
   - Remove empty `QualityDashboard/` directory
   - Consolidate duplicate header components
   - Remove versioned component names
   - Organize story files consistently

2. **Structural Reorganization:**
   - Group components by feature/domain
   - Separate UI components from business logic components
   - Create clear component hierarchy
   - Establish consistent naming conventions

3. **Code Quality Improvements:**
   - Remove unused components
   - Consolidate duplicate functionality
   - Improve component naming
   - Add proper documentation
