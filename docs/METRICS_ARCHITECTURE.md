# Metrics System Architecture

## Overview

PromptLab's metrics system provides comprehensive text analysis including readability, sentiment, and quality metrics. The system is designed with modularity, performance, and accuracy in mind.

## Core Components

### Service Layer (`packages/api/src/lib/`)

#### Primary Services

- **`metrics.ts`** - Main orchestrator, coordinates all metric calculations
- **`sentimentService.ts`** - DistilBERT (accurate) and VADER (fast) sentiment analysis
- **`readabilityService.ts`** - Flesch Reading Ease, Flesch-Kincaid, SMOG via text-readability
- **`keywordMetrics.ts`** - Token-level keyword matching with optional weighting
- **`textWorker.ts`** - Text preprocessing and tokenization utilities

#### Supporting Services

- **`latencyLogger.ts`** - Performance monitoring and P95 calculations

### API Layer (`packages/api/src/routes/`)

- **`quality-summary.ts`** - Aggregated metrics endpoint with caching and time windows

### Type Definitions (`packages/api/src/types/`)

- **`index.ts`** - Core `JobMetrics` interface and evaluation types
- **`text-readability.d.ts`** - Readability service type declarations
- **`vader-sentiment.d.ts`** - Sentiment service type declarations

## Metric Categories

### Readability Metrics

- **Flesch Reading Ease** (0-100, higher = easier)
- **Flesch-Kincaid Grade Level** (US grade level required)
- **SMOG Index** (Simple Measure of Gobbledygook)

### Sentiment Analysis

- **Primary:** DistilBERT (Xenova/distilbert-base-uncased-finetuned-sst-2-english)
- **Fallback:** VADER sentiment analysis
- **Mode:** Controlled via `SENTIMENT_MODE` environment variable

### Quality Metrics

- **Word Count** - Total words in text
- **Sentence Count** - Total sentences
- **Vocabulary Diversity** - Unique words ratio
- **Keyword Matching** - Precision, recall, F-score for specified keywords

### Performance Metrics

- **Response Time** - Job execution duration
- **P95 Latency** - 95th percentile response times (when enabled)

## Environment Configuration

| Variable              | Default | Description                                 |
| --------------------- | ------- | ------------------------------------------- |
| `SENTIMENT_MODE`      | `fast`  | `fast` (VADER) or `accurate` (DistilBERT)   |
| `WITH_P95`            | `false` | Include P95 latency in quality summaries    |
| `SUMMARY_WINDOW_DAYS` | `7`     | Default time window for quality aggregation |
| `SUMMARY_CACHE_TTL`   | `30`    | Cache TTL in seconds for quality summaries  |

## Testing Strategy

### Unit Tests (`packages/api/test/`)

- `sentimentService.test.ts` - Sentiment analysis accuracy and fallback
- `readabilityService.test.ts` - Readability calculations and text limits
- `textWorker.test.ts` - Text preprocessing utilities
- `metrics-actual.test.ts` - End-to-end metric calculation verification
- `metrics-integration.test.ts` - Service integration testing

### Integration Tests (`apps/api/test/`)

- `quality-summary.integration.test.ts` - Quality summary endpoint testing
- `default-metrics.test.ts` - Default metric calculation verification
- `metrics-selection.test.ts` - Metric selection and calculation flows

### Debug Scripts (`scripts/metrics-debug/`)

- `test-metrics.js` - Full metrics calculation testing
- `debug-sentiment.js` - Sentiment analysis debugging
- `test-readability.mjs` - Readability service testing
- `test-metrics-direct.mjs` - Direct metrics API testing
- `test-all-metrics-markdown.mjs` - Markdown vs plain text comparison
- `test-readability-levels.mjs` - Readability level validation
- `test-actual-response.mjs` - Real job response testing

## Architecture Principles

### 1. Separation of Concerns

- Each service handles one metric category
- Main `metrics.ts` orchestrates without business logic
- Type definitions centralized in `types/`

### 2. Performance Optimization

- Async/await throughout for non-blocking operations
- Text preprocessing cached and reused
- Expensive operations (DistilBERT) run only in accurate mode

### 3. Graceful Degradation

- Sentiment: DistilBERT → VADER → simple word-based fallback
- Readability: text-readability → manual syllable counting fallback
- Error handling preserves partial results

### 4. Testing Coverage

- Unit tests for individual services
- Integration tests for API endpoints
- Debug scripts for manual verification
- All tests use proper mocking for external dependencies

## Usage Examples

### Basic Metrics Calculation

```typescript
import { calculateMetrics } from '@prompt-lab/api/lib/metrics';

const metrics = await calculateMetrics(text, [
  { id: 'flesch_reading_ease' },
  { id: 'sentiment' },
  { id: 'word_count' },
  { id: 'keywords', input: 'climate,renewable,sustainability' },
]);
```

### Quality Summary API

```bash
# Get 7-day quality summary
GET /api/quality-summary

# Filter by model and time range
GET /api/quality-summary?model=gpt-4&windowDays=30

# Include P95 latency
WITH_P95=true GET /api/quality-summary
```

## Migration Notes

### Deprecated Components

- `packages/api/src/evaluation/metrics/` - Removed, functionality moved to `lib/metrics.ts`
- Manual heuristic calculations - Replaced with proper libraries
- Binary sentiment scores - Now using nuanced VADER/DistilBERT scoring

### Breaking Changes

- Sentiment scores now return -1 to 1 range (was 0/1)
- Readability scores properly calculated (was often 0)
- Keywords require explicit specification (no default assumptions)

## Future Enhancements

1. **BERTScore Integration** - Optional microservice for semantic similarity
2. **Custom Model Support** - Plugin architecture for additional analysis
3. **Real-time Streaming** - Progressive metric calculation for long texts
4. **ML-based Quality** - Trained models for content quality assessment
