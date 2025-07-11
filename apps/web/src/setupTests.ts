import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Properly mock EventSource instead of using polyfill
Object.defineProperty(globalThis, 'EventSource', {
  value: vi.fn().mockImplementation((url: string) => ({
    url,
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSED: 2,
    onopen: null,
    onmessage: null,
    onerror: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    close: vi.fn(),
  })),
  writable: true,
  configurable: true,
});

// Mock EventSource for tests
class MockEventSource extends EventTarget {
  public onmessage!: (evt: MessageEvent) => void;
  public onerror!: (evt: Event) => void;
  public readyState: number = 1;

  constructor(public url: string) {
    super();
  }

  emit(data: string) {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent);
    }
  }

  close() {
    this.readyState = 2;
  }
}

// Replace global EventSource in test environment

(globalThis as any).EventSource = MockEventSource;

// Mock ResizeObserver for Recharts
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

(globalThis as any).ResizeObserver = MockResizeObserver;

// Mock window.scrollTo for JSDOM
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
