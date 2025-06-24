import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import App from '../src/App.js';

describe('App', () => {
  it('renders', () => {
    render(<App />);
  });
});
