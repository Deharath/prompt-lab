// splitMarkdownSafe.ts
// Returns { safePart, rest } such that safePart is well-formed markdown, rest may be incomplete
// Heuristic: code fences, inline code, links/images, bold/italic

export function splitMarkdownSafe(buf: string): {
  safePart: string;
  rest: string;
} {
  let inCodeFence = false;
  let inInlineCode = false;
  let bracketStack = 0;
  let parenStack = 0;
  let emphasisStack: string[] = []; // Stack to track emphasis markers
  let i = 0;
  let lastSafePosition = 0; // Track the last position that was completely safe

  while (i < buf.length) {
    const char = buf[i];

    // Check for code fence (```) at start of line or after newline
    if (buf.startsWith('```', i) && (i === 0 || buf[i - 1] === '\n')) {
      inCodeFence = !inCodeFence;
      i += 3;
      continue;
    }

    // Inline code (`) - only outside code fences
    if (char === '`' && !inCodeFence) {
      inInlineCode = !inInlineCode;
      i++;
      continue;
    }

    // Only parse markdown syntax outside code blocks
    if (!inCodeFence && !inInlineCode) {
      if (char === '[') {
        bracketStack++;
      } else if (char === ']') {
        bracketStack = Math.max(0, bracketStack - 1);
      } else if (char === '(' && bracketStack > 0) {
        parenStack++;
      } else if (char === ')') {
        parenStack = Math.max(0, parenStack - 1);
      } else if (char === '*' || char === '_') {
        // Handle emphasis (bold/italic)
        let count = 1;

        // Count consecutive markers
        while (i + count < buf.length && buf[i + count] === char) {
          count++;
        }

        // For bold (**) or italic (*), we track them differently
        const markerStr = char.repeat(count);

        // Check if this marker closes an existing emphasis
        const lastEmphasisIndex = emphasisStack.lastIndexOf(markerStr);
        if (lastEmphasisIndex !== -1) {
          // This closes a previous emphasis
          emphasisStack.splice(lastEmphasisIndex, 1);
        } else {
          // This opens a new emphasis
          emphasisStack.push(markerStr);
        }

        i += count;
        continue;
      }
    }

    // Check if we're in a safe state after processing this character
    const isCurrentlyWellFormed =
      !inCodeFence &&
      !inInlineCode &&
      bracketStack === 0 &&
      parenStack === 0 &&
      emphasisStack.length === 0;

    if (isCurrentlyWellFormed) {
      // Update the last safe position to include this character
      lastSafePosition = i + 1;
    }

    i++;
  }

  // Check if we're in a completely safe state at the end
  const isCompletelyWellFormed =
    !inCodeFence &&
    !inInlineCode &&
    bracketStack === 0 &&
    parenStack === 0 &&
    emphasisStack.length === 0;

  if (isCompletelyWellFormed) {
    return { safePart: buf, rest: '' };
  } else {
    // Return everything up to the last safe position
    const safePart = buf.substring(0, lastSafePosition);
    const rest = buf.substring(lastSafePosition);
    return { safePart, rest };
  }
}
