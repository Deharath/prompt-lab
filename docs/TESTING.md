# Testing Guide

This document outlines the testing strategy, tools, and practices for the prompt-lab project.

## Overview

Our testing strategy follows a multi-layered approach designed for maintainability, reliability, and developer productivity:

- **Backend API Services**: Unit and integration tests using Vitest
- **Frontend Components**: Storybook for visual testing and component states
- **Frontend Logic**: Unit tests for stores, hooks, and business logic
- **Workflow Integration**: End-to-end tests for critical user flows
- **CI/CD**: Automated test execution with quality gates

## Test Structure

```
packages/api/test/           # Backend service tests
├── sentimentService.test.ts
├── readabilityService.test.ts
├── textWorker.test.ts
├── keywordMetrics.test.ts
├── metrics.test.ts
└── quality-summary.integration.test.ts

apps/web/test/              # Frontend logic tests
├── store/
│   ├── workspaceStore.test.ts
│   └── jobStore.test.ts
├── hooks/
│   └── useJobStreaming.test.ts
└── integration/
    ├── runJobWorkflow.test.ts
    └── diffWorkflow.test.ts

apps/web/src/components/    # Component stories
├── *.stories.tsx           # Storybook stories
└── docs/                   # Storybook documentation
```

## Running Tests

### Quick Commands

```bash
# Run all tests
pnpm test

# Backend tests only
cd packages/api && pnpm test

# Frontend tests only
cd apps/web && pnpm test

# Storybook component testing
cd apps/web && pnpm storybook
```

### Zen Mode (Clean Output)

For distraction-free testing during development:

```bash
cd apps/web && npm run test:quiet
```

This suppresses verbose npm error output and provides clean test results.

### Coverage Reports

```bash
# Backend coverage
cd packages/api && pnpm test:coverage

# Frontend coverage
cd apps/web && pnpm test:coverage
```

## Backend Testing

### Service Unit Tests

Located in `packages/api/test/`, these tests verify individual service functions:

- **Sentiment Service**: Tests VADER and DistilBERT modes with fallback
- **Readability Service**: Validates Flesch-Kincaid and other readability metrics
- **Text Worker**: Tests text preprocessing and tokenization
- **Keyword Metrics**: Tests keyword matching and scoring

### Integration Tests

End-to-end tests that verify API endpoints:

- **Quality Summary**: Tests `/api/quality-summary` with database integration
- **Job Processing**: Tests complete job lifecycle from creation to metrics

### Best Practices

- Mock external dependencies (OpenAI API, database)
- Use realistic test data that matches production scenarios
- Test both happy path and error conditions
- Verify metrics calculation accuracy with known expected values

## Frontend Testing

### Storybook Component Testing

Primary tool for UI component validation:

```bash
cd apps/web && pnpm storybook
```

**What we test with Storybook:**

- Component rendering in different states (loading, error, success)
- Props variations and edge cases
- User interactions via play functions
- Visual regression testing
- Responsive design behavior

**Key Stories:**

- `UnifiedPanel.stories.tsx` - Main evaluation interface
- `ResultsDisplay.stories.tsx` - Metrics and output display
- `PromptWorkspace.stories.tsx` - Prompt editing interface

### State Management Tests

Unit tests for Zustand stores in `apps/web/test/store/`:

- **Workspace Store**: Template management, job execution, state transitions
- **Job Store**: Job history, comparison features, metrics tracking

### Custom Hooks Tests

Located in `apps/web/test/hooks/`:

- **useJobStreaming**: Server-sent events, real-time updates, error handling

### Workflow Integration Tests

End-to-end tests for critical user journeys in `apps/web/test/integration/`:

- **Run Job Workflow**: Complete flow from prompt to results
- **Diff Workflow**: Job comparison and metrics analysis

## Testing Philosophy

### What We Test

**High-Value Tests:**

- Business logic in services and stores
- API endpoints and data flow
- Critical user workflows
- Error handling and edge cases

**Component Behavior:**

- State management integration
- User interaction handling
- Data transformation and display

### What We Don't Test

**Low-Value Tests:**

- Simple getters/setters
- Third-party library internals
- Trivial utility functions
- Static content rendering

### Test Quality Standards

- **Maintainable**: Tests should be easy to read and update
- **Reliable**: Tests should pass consistently and fail only for real issues
- **Fast**: Test suite should run quickly for rapid feedback
- **Focused**: Each test should verify one specific behavior

## CI/CD Integration

### GitHub Actions

Tests run automatically on:

- Pull request creation/updates
- Pushes to main branch
- Release creation

### Quality Gates

Pull requests are blocked if:

- Any test fails
- Coverage drops below thresholds (85% for critical services)
- Linting errors exist

### Test Execution Strategy

1. **Parallel Execution**: Backend and frontend tests run simultaneously
2. **Fast Feedback**: Unit tests run first, then integration tests
3. **Dependency Management**: Tests use isolated environments

## Coverage Targets

### Backend Services

- **Critical Services**: >85% coverage (sentiment, readability, metrics)
- **Utilities**: >70% coverage
- **Integration**: >60% coverage

### Frontend Logic

- **Stores**: >90% coverage
- **Hooks**: >85% coverage
- **Workflows**: >70% coverage

## Adding New Tests

### Backend Service Test

```typescript
// packages/api/test/newService.test.ts
import { describe, it, expect } from 'vitest';
import { newService } from '../src/lib/newService.js';

describe('newService', () => {
  it('should handle valid input', () => {
    const result = newService('test input');
    expect(result).toBeDefined();
  });
});
```

### Frontend Store Test

```typescript
// apps/web/test/store/newStore.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNewStore } from '../../src/store/newStore.js';

describe('useNewStore', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useNewStore());
    expect(result.current.initialValue).toBe(expected);
  });
});
```

### Storybook Story

```typescript
// apps/web/src/components/NewComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { NewComponent } from './NewComponent';

const meta: Meta<typeof NewComponent> = {
  title: 'Components/NewComponent',
  component: NewComponent,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // component props
  },
};
```

## Debugging Tests

### Common Issues

**Test Isolation**: Each test should be independent

```bash
# Run single test file
npm test -- newService.test.ts

# Run with watch mode
npm test -- --watch
```

**Async Testing**: Properly handle promises and async operations

```typescript
// Good: await async operations
await act(async () => {
  await asyncOperation();
});
```

**Mocking**: Mock external dependencies consistently

```typescript
vi.mock('../api.js', () => ({
  ApiClient: {
    method: vi.fn(),
  },
}));
```

### Performance

Monitor test execution time:

```bash
npm test -- --reporter=verbose
```

Slow tests indicate:

- Unnecessary async operations
- Missing mocks for external services
- Complex setup that could be simplified

## Getting Help

- **Test Failures**: Check CI logs for specific error messages
- **Coverage Issues**: Use coverage reports to identify untested code paths
- **Storybook Problems**: Verify component props and story configuration
- **Mocking Issues**: Ensure mocks match actual API interfaces

## Continuous Improvement

Our testing strategy evolves with the codebase:

- **Regular Reviews**: Assess test coverage and quality monthly
- **Refactoring**: Update tests when components or services change
- **Tool Updates**: Keep testing dependencies current
- **Documentation**: Update this guide as practices evolve

The goal is a test suite that provides confidence in deployments while remaining maintainable and efficient.
