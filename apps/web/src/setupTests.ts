import 'eventsource-polyfill';
import '@testing-library/jest-dom/vitest';

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).EventSource = MockEventSource;
