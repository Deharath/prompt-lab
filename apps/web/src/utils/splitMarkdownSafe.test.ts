import { describe, it, expect } from 'vitest';
import { splitMarkdownSafe } from '../utils/splitMarkdownSafe.js';

describe('splitMarkdownSafe', () => {
  it('should return all for plain text', () => {
    const { safePart, rest } = splitMarkdownSafe('hello world');
    expect(safePart).toBe('hello world');
    expect(rest).toBe('');
  });

  it('should not split inside incomplete code fence', () => {
    const { safePart, rest } = splitMarkdownSafe('```js\nconst x = 1;');
    expect(safePart).toBe('');
    expect(rest).toBe('```js\nconst x = 1;');
  });

  it('should split after complete code fence', () => {
    const { safePart, rest } = splitMarkdownSafe(
      '```js\nconst x = 1;\n```\nhello',
    );
    expect(safePart).toBe('```js\nconst x = 1;\n```\nhello');
    expect(rest).toBe('');
  });

  it('should return safe content before incomplete inline code', () => {
    const { safePart, rest } = splitMarkdownSafe('This is `code');
    expect(safePart).toBe('This is ');
    expect(rest).toBe('`code');
  });

  it('should split after complete inline code', () => {
    const { safePart, rest } = splitMarkdownSafe('This is `code` done');
    expect(safePart).toBe('This is `code` done');
    expect(rest).toBe('');
  });

  it('should return safe content before incomplete link', () => {
    const { safePart, rest } = splitMarkdownSafe('See [link');
    expect(safePart).toBe('See ');
    expect(rest).toBe('[link');
  });

  it('should split after complete link', () => {
    const { safePart, rest } = splitMarkdownSafe('See [link](url) done');
    expect(safePart).toBe('See [link](url) done');
    expect(rest).toBe('');
  });

  it('should handle bold/italic', () => {
    const { safePart, rest } = splitMarkdownSafe('**bold** _italic_');
    expect(safePart).toBe('**bold** _italic_');
    expect(rest).toBe('');
  });

  it('should return safe content before incomplete bold', () => {
    const { safePart, rest } = splitMarkdownSafe('**bold');
    expect(safePart).toBe('');
    expect(rest).toBe('**bold');
  });

  it('should handle multiple constructs', () => {
    const { safePart, rest } = splitMarkdownSafe(
      '**bold** `code` [link](url)\n```js\ncode\n```',
    );
    expect(safePart).toBe('**bold** `code` [link](url)\n```js\ncode\n```');
    expect(rest).toBe('');
  });

  it('should preserve headers when there is incomplete bold text', () => {
    const { safePart, rest } = splitMarkdownSafe(
      '### Header\n\nParagraph with **incomplete',
    );
    expect(safePart).toBe('### Header\n\nParagraph with ');
    expect(rest).toBe('**incomplete');
  });

  it('should preserve multiple headers and complete content', () => {
    const { safePart, rest } = splitMarkdownSafe(
      '### Header 1\n\nSome text.\n\n### Header 2\n\nText with **incomplete',
    );
    expect(safePart).toBe(
      '### Header 1\n\nSome text.\n\n### Header 2\n\nText with ',
    );
    expect(rest).toBe('**incomplete');
  });
});
