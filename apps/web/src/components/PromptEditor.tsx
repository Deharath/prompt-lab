import {
  countTokens,
  countTokensAsync,
  formatTokenCount,
} from '../utils/tokenCounter.js';
import { useState, useEffect, useRef } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  model?: string;
}

const PromptEditor = ({ value, onChange, model = 'gpt-4o-mini' }: Props) => {
  const [tokenCount, setTokenCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate tokens - try async first, fallback to sync
  useEffect(() => {
    const updateTokenCount = async () => {
      try {
        const count = await countTokensAsync(value, model);
        setTokenCount(count);
      } catch (_error) {
        // Fallback to sync calculation
        setTokenCount(countTokens(value, model));
      }
    };

    updateTokenCount();
  }, [value, model]);

  // Robust auto-resize with proper height calculation
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const minHeight = 128;

      // Get current height, handling initial state properly
      const currentHeight = textarea.offsetHeight;

      // Create helper element with precise style matching
      const helper = document.createElement('textarea');
      const textareaStyles = window.getComputedStyle(textarea);

      // Copy only the styles that affect text layout and height calculation
      helper.style.position = 'absolute';
      helper.style.visibility = 'hidden';
      helper.style.top = '-9999px';
      helper.style.left = '-9999px';
      helper.style.height = 'auto';
      helper.style.minHeight = '0';
      helper.style.maxHeight = 'none';
      helper.style.resize = 'none';
      helper.style.overflow = 'hidden';

      // Copy critical styles for accurate measurement
      helper.style.width = textarea.offsetWidth + 'px'; // Exact width including padding/border
      helper.style.fontFamily = textareaStyles.fontFamily;
      helper.style.fontSize = textareaStyles.fontSize;
      helper.style.fontWeight = textareaStyles.fontWeight;
      helper.style.lineHeight = textareaStyles.lineHeight;
      helper.style.letterSpacing = textareaStyles.letterSpacing;
      helper.style.wordSpacing = textareaStyles.wordSpacing;
      helper.style.padding = textareaStyles.padding;
      helper.style.border = textareaStyles.border;
      helper.style.boxSizing = textareaStyles.boxSizing;
      helper.style.whiteSpace = textareaStyles.whiteSpace;
      helper.style.wordWrap = textareaStyles.wordWrap;
      helper.style.wordBreak = textareaStyles.wordBreak;

      helper.value = value;

      document.body.appendChild(helper);

      // Get required height with minimal, consistent buffer
      const rawRequiredHeight = helper.scrollHeight;

      // Use minimal, consistent buffer - just enough to prevent cramping
      const minimalBuffer = 6; // Simple 6px buffer for all content
      const requiredHeight = Math.max(
        minHeight,
        rawRequiredHeight + minimalBuffer,
      );

      document.body.removeChild(helper);

      // Perfect-fit resize logic: always match content size, preventing only micro-adjustments
      const heightDifference = Math.abs(requiredHeight - currentHeight);
      let shouldResize = false;
      let newHeight = requiredHeight; // Always target the perfect fit height

      // Only resize if there's a meaningful difference (>3px) to prevent micro-flickering
      if (heightDifference > 3) {
        shouldResize = true;
      }

      if (shouldResize) {
        // Save scroll position and viewport info before height change
        const scrollTop = window.pageYOffset;
        const viewportHeight = window.innerHeight;
        const textareaRect = textarea.getBoundingClientRect();
        const textareaBottom = textareaRect.bottom;
        const shouldPreventScroll = textareaBottom > viewportHeight * 0.7;

        if (shouldPreventScroll) {
          // Temporarily disable scroll during height change
          const body = document.body;
          const originalOverflow = body.style.overflow;
          const originalPosition = body.style.position;
          const originalTop = body.style.top;
          const originalWidth = body.style.width;

          body.style.overflow = 'hidden';
          body.style.position = 'fixed';
          body.style.top = `-${scrollTop}px`;
          body.style.width = '100%';

          // Apply height change
          textarea.style.height = `${newHeight}px`;

          // Re-enable scrolling and restore position
          requestAnimationFrame(() => {
            body.style.overflow = originalOverflow;
            body.style.position = originalPosition;
            body.style.top = originalTop;
            body.style.width = originalWidth;
            window.scrollTo(0, scrollTop);
          });
        } else {
          // Safe to resize normally
          textarea.style.height = `${newHeight}px`;
        }
      }
    }
  }, [value]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          id="prompt-editor"
          data-testid="prompt-editor"
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your prompt template here. Use {{input}} for variable substitution...

Example:
Analyze the following text and provide a summary:

{{input}}

Please focus on the key points and main themes."
          className="w-full px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono text-sm transition-all duration-200 bg-background text-foreground placeholder-muted-foreground/80 border border-border/50"
          style={{ minHeight: '128px' }}
        />
      </div>

      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-2">
          <div className="text-xs px-2 py-1 rounded-md bg-muted/70 text-foreground font-medium">
            {value.length} chars
          </div>
          {value.length > 0 && (
            <div className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
              {formatTokenCount(tokenCount)} tokens
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptEditor;
