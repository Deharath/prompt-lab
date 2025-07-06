import React, { useState, useEffect, useRef } from 'react';
import { countTokens, countTokensAsync } from '../../../utils/tokenCounter.js';
import { LoadingSkeleton } from '../../ui/LoadingState.js';

interface InputEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  model?: string;
}

const InputEditor = ({
  value,
  onChange,
  placeholder,
  model = 'gpt-4o-mini',
}: InputEditorProps) => {
  const [tokenCount, setTokenCount] = useState(0);
  const [isCalculatingTokens, setIsCalculatingTokens] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const updateCounts = async () => {
      setIsCalculatingTokens(true);
      try {
        const count = await countTokensAsync(value, model);
        setTokenCount(count);
      } catch (_error) {
        setTokenCount(countTokens(value, model));
      }
      setIsCalculatingTokens(false);
    };

    updateCounts();
  }, [value, model]);

  // Smart auto-resize with intelligent growing and shrinking
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const minHeight = 96;

      // Get current height
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
      helper.style.width = textarea.offsetWidth + 'px';
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

      // Get required height with small buffer for optimal display
      const rawRequiredHeight = helper.scrollHeight;
      const lineHeight = parseInt(textareaStyles.lineHeight) || 20;
      const bufferSpace = Math.max(4, lineHeight * 0.2); // Small buffer: 4px or 20% of line height
      const requiredHeight = Math.max(
        minHeight,
        rawRequiredHeight + bufferSpace,
      );

      document.body.removeChild(helper);

      // Perfect-fit resize logic: always match content size, preventing only micro-adjustments
      const heightDifference = Math.abs(requiredHeight - currentHeight);
      let shouldResize = false;
      const newHeight = requiredHeight; // Always target the perfect fit height

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

  const insertSampleText = () => {
    const sampleTexts = [
      'Write a detailed analysis of market trends in the technology sector.',
      'Create a summary of the latest developments in artificial intelligence and machine learning.',
      'Explain the impact of climate change on global agriculture and food security.',
      'Describe the evolution of remote work and its effects on productivity and work-life balance.',
    ];

    const randomSample =
      sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    onChange(randomSample);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          id="input-editor"
          data-testid="input-editor"
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            placeholder ||
            'Enter the data you want to analyze or process...\n\nFor example:\n- News articles for summarization\n- Customer reviews for sentiment analysis\n- Code snippets for review\n- Any text content for your prompt template'
          }
          className="focus:ring-primary/50 bg-background text-foreground placeholder-muted-foreground/80 border-border/50 w-full resize-none rounded-lg border px-4 py-3 font-mono text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:outline-none"
          style={{ minHeight: '96px' }}
        />
      </div>

      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-2">
          <div className="bg-muted/70 text-foreground rounded-md px-2 py-1 text-xs font-medium">
            {value.length} chars
          </div>
          {value.length > 0 && (
            <div className="bg-primary/10 text-primary rounded-md px-2 py-1 text-xs font-medium">
              {isCalculatingTokens ? (
                <LoadingSkeleton className="h-4 w-20" />
              ) : (
                `${tokenCount} tokens`
              )}
            </div>
          )}
        </div>
      </div>

      {value.length === 0 && (
        <div className="flex justify-end pt-2">
          <button
            onClick={insertSampleText}
            className="bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50 rounded-md border px-3 py-1.5 text-xs transition-colors"
            title="Insert sample text"
          >
            Add Sample
          </button>
        </div>
      )}
    </div>
  );
};

export default InputEditor;
