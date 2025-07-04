# Metrics Integration Epic (v2) — 2025‑07‑04

## Task 0 – Library Spike & Cold‑Start Timing

- **Install:** `text-readability-ts`, `vader-sentiment`, `@xenova/transformers`, `wink-tokenizer`.
- **Outcome:** Script proves each lib loads under Node 18 and logs cold‑start ms.
- **Accept:** CLI prints FRE & VADER scores for sample text.

---

## Task 1 – Shared Text Utilities (`packages/api/src/lib/textWorker.ts`)

- Tokenisation + normalisation wrapper around `wink-tokenizer`.
- **Accept:** Jest suite ≥ 95 % token overlap with wink reference.

---

## Task 2 – Readability Service

- Expose FRE, FK, SMOG via `text-readability-ts`.
- Reject input > 20 kB with 413.
- **Accept:** Values match lib examples ±0.1.

---

## Task 3 – Sentiment Service (Fast / Accurate)

- **Fast:** VADER.  **Accurate:** HF `distilbert-base-uncased-finetuned-sst-2` (transformers.js).
- Toggle with `SENTIMENT_MODE` env.
- **Accept:** “love” > 0.5, “hate” < –0.5 in both modes.

---

## Task 4 – Keyword Metrics

- Token‑level match (from Task 1). Optional per‑keyword `weight`.
- **Accept:** Weighted P/R regression passes plural & accent cases.

---

## Task 5 – BERTScore Microservice (Optional)

- Dockerised Flask app plus Express proxy.
- Enabled only if `ENABLE_BERTSCORE=true`.
- **Accept:** 200‑token pair ≤ 800 ms on M1 when flag enabled.

---

## Task 6 – Basic Latency Logging

- Wrap generation pipeline with `performance.now()`.
- Write p50/p95/p99 to rotating JSON log (one file per day) in `logs/metrics/`.
- **Accept:** Log file shows correct percentiles after soak test at 100 rps.

> _Follow‑up Epic_: "Telemetry Stack" (Prometheus + Grafana) parked for Q3.

---

## Task 7 – **`/quality-summary`** Endpoint

- **Path:** `packages/api/src/routes/quality-summary.ts`.
- **Query:** `model?`, `since?`, `until?`, `windowDays?` (default = `SUMMARY_WINDOW_DAYS`).
- **SQL aggregation:** same as v1 **minus p95**; fetch `response_time_ms` array only if `WITH_P95=true` flag.
- **p95 calculation:** In‑code: sort array, index ⌈0.95·n⌉.
- **Index note:** add generated columns once rows > 10 k (backlog ticket).
- **Cache:** 30 s in‑memory via `node-cache`, TTL from env.
- **Auth:** reuse existing middleware.
- **Accept:** Postman test returns JSON with `avg` and `p95_latency_ms` fields; cache hit < 10 ms.

---

## Task 8 – React Hook & UI (Existing Client)

- Hook `useQualitySummary(params)` built on current API client.
- Display tile cards per model; tooltip metric definitions.
- **Accept:** QA passes dark/light themes; offline fallback notice.

---

## Task 9 – Tests & CI

- **Unit:** ≥ 90 % coverage new modules.
- **Integration:** Supertest for `/quality-summary` happy + error paths.
- **E2E:** Cypress dashboard load.
- **Accept:** GitHub Actions green < 5 min.

---

## Task 10 – Docs & Migration

- Update architecture diagram & README.
- Note removal of heuristic helpers.
- Document env flags: `SENTIMENT_MODE`, `ENABLE_BERTSCORE`, `WITH_P95`, `SUMMARY_WINDOW_DAYS`, `SUMMARY_CACHE_TTL`.
- **Accept:** PR approved with no TODO.

---

### Definition of Done

- `/quality-summary` live in staging & prod, returning accurate aggregates including computed p95.
- New metrics are integrated into the "Evaluation Results" panel on the `RunViewerPage`.
- Legacy heuristic helpers removed.
- Basic latency logs written; telemetry epic tracked.
- README reflects new metrics stack and flags.

---

## Integration with Evaluation Results Panel

### Task 11 – Backend Metric Calculation

- **File:** `packages/api/src/lib/metrics.ts` (or similar)
- **Action:** Implement the new metric calculation functions as described in Tasks 2-5.

### Task 12 – Update `calculateSelectedMetrics`

- **File:** `apps/api/src/routes/jobs.ts`
- **Action:** Update the `calculateSelectedMetrics` function to call the new metric calculation functions.

### Task 13 – Frontend UI

- **File:** `apps/web/src/pages/RunViewerPage.tsx`
- **Action:** Update the `RunViewerPage` component to display the new metrics in the "Metrics" section.

---

## ✅ COMPLETED: Sentiment Analysis ESM Fix

**Issue:** Sentiment scores were returning 0/1 values instead of nuanced VADER scores due to ESM/CommonJS import conflict.

**Resolution:**

- Fixed `sentimentService.ts` to use dynamic imports (`await import()`) instead of `require()`
- Added TypeScript declarations for `vader-sentiment`
- Enhanced job metrics to always calculate default metrics (readability, sentiment, word count)
- Verified with integration tests

**Result:** VADER sentiment analysis now working correctly with decimal precision (-1 to 1 range).

---
