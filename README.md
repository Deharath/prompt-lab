### `README.md`

````markdown
# PromptLab MVP

> A production-grade sandbox for **LLM prompt engineering & evaluation**.  
> Editors tweak a prompt, hit **Run**, and instantly see quality, latency and $$$ metrics.  
> Built to showcase solid Node/TS chops, not slide-deck vapour.

---

## ✨ Features

* **Multi-model**: GPT-4o, GPT-3.5-turbo, Gemini-pro (adapter pattern).  
* **Automated eval**: cosine similarity via embeddings, exact-match & length heuristics, pluggable DeepEval/BERTScore.  
* **Cost & latency tracking** baked into every run.  
* **React UI** with history sidebar — zero backend refresh.  
* **CI gate** fails if your latest prompt worsens the benchmark.  
* **Monorepo** (`pnpm`) with strict TypeScript everywhere.

---

## 🗂️ Architecture

```mermaid
sequenceDiagram
  participant Editor
  participant Web_UI as Web UI (React)
  participant API as Express API
  participant LLM
  participant Evaluator

  Editor->>Web_UI: Edit prompt + click Run
  Web_UI->>API: POST /eval {template,model,setId}
  API->>LLM: Batched calls with hydrated prompts
  LLM-->>API: Completions
  API->>Evaluator: {input,expected,completion}
  Evaluator-->>API: Scores, tokenUsage, latency
  API-->>Web_UI: per-item + aggregate JSON
  Web_UI-->>Editor: Render table & graphs
````

---

## 🚀 Quick Start

```bash
git clone https://github.com/you/prompt-lab.git
cd prompt-lab
pnpm install

cp .env.example .env   # add your OPENAI_API_KEY
pnpm dev               # runs api + web concurrently
```

Visit `http://localhost:5173` and start hacking.

---

## 🛠️ Dev Scripts

| Command                     | What it does                                                      |
| --------------------------- | ----------------------------------------------------------------- |
| `pnpm dev`                  | Vite front-end + ts-node-dev backend                              |
| `pnpm test`                 | Vitest unit tests                                                 |
| `pnpm test:e2e`             | One full prompt-eval against test set; fails if `avgCosSim < 0.7` |
| `pnpm -r tsc --noEmit`      | Type-check all workspaces                                         |
| `pnpm lint` / `pnpm format` | ESLint + Prettier                                                 |

---

## 📦 Folder Structure

```text
prompt-lab/
├─ apps/
│  ├─ api/           # Express + Zod, /health & /eval
│  └─ web/           # React 18 + shadcn/ui front-end
├─ packages/
│  ├─ evaluator/     # Pure-TS metrics lib
│  └─ test-cases/    # JSONL fixtures for eval
└─ .github/          # CI workflows
```

---

## 🧪 Test Philosophy

* **Unit** → deterministic logic (`applyTemplate`, `scorePair`).
* **Integration** → mocked OpenAI calls to assert api contract.
* **E2E** → real model hit on a tiny set, run in CI nightly or on demand.

---

## 📋 TODO / Stretch Goals

* LangChain adapters for “bring-your-own model”.
* Swap embedding cosine for GPT-4o self-eval & compare correlation.
* Minimal RAG pipeline measuring hallucination rate.

---

## 🛑 Disclaimers

* This repo stores **no** cloud credentials. Provide your own `.env`.
* Example test-cases are synthetic to avoid copyright fuss.
* Licensed MIT — use at your own risk; double-check token cost before slamming `pnpm test:e2e`.

---

![CI](https://img.shields.io/badge/CI-pending-lightgrey)  ![Coverage](https://img.shields.io/badge/coverage-0%25-red)
*Badge placeholders auto-update once CI is wired.*

---

*End of README.md*
