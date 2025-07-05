/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../src/components/layout/Header.tsx';

describe('Header', () => {
  it('renders the header with the correct title', () => {
    render(<Header sidebarCollapsed={false} onToggleSidebar={() => {}} />);
    const titleElement = screen.getByText(/Prompt Lab/i);
    expect(titleElement).toBeInTheDocument();
  });

  it('calls the onToggleSidebar function when the menu button is clicked', () => {
    const onToggleSidebar = vi.fn();
    render(<Header sidebarCollapsed={false} onToggleSidebar={onToggleSidebar} />);
    const menuButton = screen.getByRole('button', { name: /toggle sidebar/i });
    menuButton.click();
    expect(onToggleSidebar).toHaveBeenCalledTimes(1);
  });
});
