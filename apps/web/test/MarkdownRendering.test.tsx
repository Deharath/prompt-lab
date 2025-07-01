import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LiveOutput } from '../src/components/LiveOutput.js';

describe('LiveOutput Markdown Rendering', () => {
  it('should render markdown headers correctly', () => {
    const markdownContent = `### This is a Header

This is a paragraph with **bold text**.

Another paragraph here.

### Another Header

More content with **another bold** text.`;

    render(<LiveOutput outputText={markdownContent} status="complete" />);

    // Check that headers are rendered as h3 elements
    const headers = screen.getAllByRole('heading', { level: 3 });
    expect(headers[0]).toHaveTextContent('This is a Header');
    expect(headers[1]).toHaveTextContent('Another Header');

    // Check that bold text is rendered with strong elements
    const boldElements = screen.getAllByText((content, element) => {
      return element?.tagName === 'STRONG';
    });
    expect(boldElements.length).toBeGreaterThan(0);

    // Check that the text appears in the document
    expect(screen.getByText('bold text')).toBeInTheDocument();
    expect(screen.getByText('another bold')).toBeInTheDocument();
    expect(screen.getByText('Another paragraph here.')).toBeInTheDocument();
  });

  it('should handle streaming markdown safely', () => {
    const partialMarkdown = `### This is a Header

This is a paragraph with **bold`;

    render(<LiveOutput outputText={partialMarkdown} status="streaming" />);

    // The header should be rendered even if the bold text is incomplete
    const headers = screen.getAllByRole('heading', { level: 3 });
    // Find the header we expect (might be multiple due to component structure)
    const targetHeader = headers.find(
      (h) => h.textContent === 'This is a Header',
    );
    expect(targetHeader).toBeTruthy();
    expect(targetHeader).toHaveTextContent('This is a Header');
  });

  it('should switch between rendered and raw modes', () => {
    const markdownContent = `### Header\n\nContent with **bold**.`;

    render(<LiveOutput outputText={markdownContent} status="complete" />);

    // In rendered mode, should show parsed markdown
    const headers = screen.getAllByRole('heading', { level: 3 });
    const targetHeader = headers.find((h) => h.textContent === 'Header');
    expect(targetHeader).toBeTruthy();
    expect(targetHeader).toHaveTextContent('Header');

    // Find the specific Raw button for this component
    const rawButtons = screen.getAllByRole('button', { name: /raw/i });
    const rawButton = rawButtons[0]; // Take the first one
    fireEvent.click(rawButton);

    // After clicking, the button should be pressed
    expect(rawButton).toHaveAttribute('aria-pressed', 'true');
  });
});
