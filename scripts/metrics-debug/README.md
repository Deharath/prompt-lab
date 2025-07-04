# Metrics Debug Scripts

This directory contains debug and testing scripts for the metrics system. These scripts are used for manual verification, troubleshooting, and development testing.

## Scripts Overview

### Core Testing Scripts

#### `test-metrics.js`

- **Purpose:** Full end-to-end metrics calculation testing
- **Usage:** `node scripts/metrics-debug/test-metrics.js`
- **Tests:** All metrics via the main calculateMetrics function
- **Validates:** Sentiment, readability, keywords, word count

#### `debug-sentiment.js`

- **Purpose:** Sentiment analysis debugging and verification
- **Usage:** `node scripts/metrics-debug/debug-sentiment.js`
- **Tests:** Multiple text samples with expected sentiment ranges
- **Validates:** DistilBERT/VADER sentiment accuracy

### Readability Testing Scripts

#### `test-readability.mjs`

- **Purpose:** Basic readability service testing
- **Usage:** `node scripts/metrics-debug/test-readability.mjs`
- **Tests:** Flesch Reading Ease, FK, SMOG calculations
- **Validates:** Text-readability library integration

#### `test-readability-levels.mjs`

- **Purpose:** Comparative readability testing across complexity levels
- **Usage:** `node scripts/metrics-debug/test-readability-levels.mjs`
- **Tests:** Simple vs complex vs technical text readability scores
- **Validates:** Score ranges make logical sense

#### `test-actual-response.mjs`

- **Purpose:** Test readability with real job response content
- **Usage:** `node scripts/metrics-debug/test-actual-response.mjs`
- **Tests:** Actual markdown-formatted job responses
- **Validates:** Handling of formatted text and edge cases

### Specialized Testing Scripts

#### `test-metrics-direct.mjs`

- **Purpose:** Direct metrics API testing without job wrapper
- **Usage:** `node scripts/metrics-debug/test-metrics-direct.mjs`
- **Tests:** Main calculateMetrics function with sample data
- **Validates:** Core metrics calculation pipeline

#### `test-all-metrics-markdown.mjs`

- **Purpose:** Compare metrics calculation between markdown and plain text
- **Usage:** `node scripts/metrics-debug/test-all-metrics-markdown.mjs`
- **Tests:** All metrics on markdown vs cleaned text
- **Validates:** Text preprocessing doesn't break calculations

## Prerequisites

Before running these scripts, ensure:

1. **Build the packages:**

   ```bash
   pnpm build
   ```

2. **Verify dependencies are installed:**

   ```bash
   pnpm install
   ```

3. **Environment setup:**
   - Scripts assume built packages in `dist/` directories
   - Some scripts require specific environment variables (e.g., `SENTIMENT_MODE`)

## Running Scripts

### Individual Script Execution

```bash
# From repository root
node scripts/metrics-debug/test-metrics.js
node scripts/metrics-debug/debug-sentiment.js
node scripts/metrics-debug/test-readability.mjs
```

### Batch Testing

```bash
# Run all debug scripts (create this as needed)
for script in scripts/metrics-debug/*.{js,mjs}; do
  echo "Running $script..."
  node "$script"
  echo "---"
done
```

## Expected Output Examples

### Successful Sentiment Test

```
Testing sentiment analysis...
Text: "I love this amazing product!"
Result: { compound: 0.8516, positive: 0.741, negative: 0.0, neutral: 0.259, mode: 'accurate' }
```

### Successful Readability Test

```
Testing readability service...
Readability scores: {
  fleschReadingEase: 69.11,
  fleschKincaid: 8.1,
  smog: 10.2,
  textLength: 147
}
```

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors:**
   - Run `pnpm build` to ensure compiled code exists
   - Check that script paths are correct for your working directory

2. **Sentiment scores showing 0:**
   - Verify DistilBERT model downloads (may take time on first run)
   - Check VADER sentiment fallback is working

3. **Readability scores all 0:**
   - Verify text-readability module installation
   - Check for text preprocessing issues

4. **Import/require errors:**
   - Some scripts use ES modules (.mjs), others CommonJS (.js)
   - Ensure Node.js version supports used module format

### Debug Mode

Add verbose logging to any script by setting:

```bash
DEBUG=metrics:* node scripts/metrics-debug/test-metrics.js
```

## Development Notes

### Adding New Debug Scripts

1. **File naming:** Use descriptive names with test-_ or debug-_ prefix
2. **Module format:** Use .mjs for ES modules, .js for CommonJS
3. **Error handling:** Include try/catch blocks for graceful failures
4. **Output format:** Use clear console.log formatting for readability

### Maintenance

- Update scripts when core metrics APIs change
- Remove obsolete scripts when features are deprecated
- Keep sample text relevant and representative of actual use cases

## Integration with CI/CD

These scripts are NOT part of the automated test suite. They are for:

- Manual verification during development
- Debugging production issues
- Performance profiling
- Feature exploration

For automated testing, use the proper test suites in `packages/api/test/` and `apps/api/test/`.
