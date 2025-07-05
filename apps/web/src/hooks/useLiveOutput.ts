import { useState, useRef, useEffect } from 'react';
import { splitMarkdownSafe } from '../utils/splitMarkdownSafe.js';

export const useLiveOutput = (outputText: string, status: string) => {
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const [debouncedOutput, setDebouncedOutput] = useState(outputText);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [safeMarkdown, setSafeMarkdown] = useState('');
  const [tail, setTail] = useState('');
  const prevOutputTextRef = useRef(outputText);
  const safeMarkdownRef = useRef('');
  const tailRef = useRef('');

  useEffect(() => {
    safeMarkdownRef.current = safeMarkdown;
  }, [safeMarkdown]);

  useEffect(() => {
    tailRef.current = tail;
  }, [tail]);

  useEffect(() => {
    if (outputText === '' && prevOutputTextRef.current !== '') {
      setSafeMarkdown('');
      setTail('');
      setDebouncedOutput('');
      safeMarkdownRef.current = '';
      tailRef.current = '';
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    }
    prevOutputTextRef.current = outputText;
  }, [outputText]);

  useEffect(() => {
    if (status === 'streaming') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setDebouncedOutput(outputText);
      }, 100);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    } else {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setDebouncedOutput(outputText);
    }
  }, [outputText, status]);

  useEffect(() => {
    if (outputText === '') {
      return;
    }

    if (status === 'streaming') {
      const currentTotal = safeMarkdownRef.current + tailRef.current;

      if (outputText.startsWith(currentTotal)) {
        const newPart = outputText.slice(currentTotal.length);
        if (newPart) {
          const combined = tailRef.current + newPart;
          const { safePart, rest } = splitMarkdownSafe(combined);
          setSafeMarkdown((prev) => prev + safePart);
          setTail(rest);
        }
      } else {
        const { safePart, rest } = splitMarkdownSafe(outputText);
        setSafeMarkdown(safePart);
        setTail(rest);
      }
    } else {
      const { safePart } = splitMarkdownSafe(outputText);
      setSafeMarkdown(safePart);
      setTail('');
    }
  }, [outputText, status]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputText, debouncedOutput]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    viewMode,
    setViewMode,
    copied,
    handleCopy,
    outputRef,
    safeMarkdown,
  };
};
