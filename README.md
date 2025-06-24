# PromptLab MVP

> **LLM prompt sandbox** with live metrics on _GPT-4.1 (+ mini / nano)_ and _Gemini 2.5 Flash_.  
> Built to show real Node + TS chops, not slide-deck vapourware.

---

## ✨ Features

- **Multi-model**: GPT-4.1 (full, mini, nano) and Gemini 2.5 Flash.
- **Automated eval**: embedding-cosine, exact-match & length heuristics; DeepEval/BERTScore pluggable.
- **Cost & latency tracking** baked into every run.
- **React UI** with history pane — no backend refresh.
- **CI gate** fails if your latest prompt degrades benchmark.
- **Monorepo** (`pnpm`) with strict TypeScript.

---

## 🗂️ Architecture

```mermaid
%% PromptLab high-level flow (GPT-4.1 & Gemini 2.5 Flash)
flowchart LR
    %% style tweaks for readability – safe in GitHub
    classDef comp fill:#1f2937,stroke:#fff,color:#fff,rx:6,ry:6;
    classDef ext  fill:#0f766e,stroke:#fff,color:#fff,rx:6,ry:6;
    classDef user fill:#f59e0b,stroke:#fff,color:#fff,rx:50,ry:50;

    U[Editor]:::user -->|Run| A["Web UI"]:::comp
    A -->|POST /eval| B["Express API"]:::comp

    subgraph "LLM Pool"
        direction LR
        C["GPT-4.1*"]:::ext
        D["Gemini 2.5 Flash"]:::ext
    end

    B -->|route by <br>model| C
    B --> D

    C --> B
    D --> B

    B --> E["Evaluator<br>(metrics + cost)"]:::comp
    E --> B
    B --> A
    A -->|Render results| U

```

---

## 🚀 Quick Start

```bash
git clone https://github.com/you/prompt-lab.git
cd prompt-lab
pnpm install

cp .env.example .env    # add OPENAI_API_KEY & GEMINI_API_KEY
pnpm dev
```

Then visit `http://localhost:5173`.

---

## 🛠️ Dev Scripts

| Command                     | Purpose                                      |
| --------------------------- | -------------------------------------------- |
| `pnpm dev`                  | Vite front-end + ts-node-dev API             |
| `pnpm test`                 | Vitest unit                                  |
| `pnpm test:e2e`             | Full prompt-eval; fails if `avgCosSim < 0.7` |
| `pnpm -r tsc --noEmit`      | Type-check all pkgs                          |
| `pnpm lint` / `pnpm format` | Lint & auto-format                           |

---

## 📦 Folder Structure

```text
prompt-lab/
├─ apps/
│  ├─ api/            # Express + Zod
│  └─ web/            # React + shadcn/ui
├─ packages/
│  ├─ evaluator/      # Metrics lib
│  └─ test-cases/     # JSONL fixtures
└─ .github/           # CI workflows
```

---

## 📋 Stretch Goals

- Adapter layer for “bring-your-own” model.
- GPT self-eval metric vs. embedding cosine.
- Micro RAG experiment tracking hallucination.

---

## 🛑 Disclaimers

- No cloud creds stored—use your own `.env`.
- Test cases are synthetic.
- MIT licence; double-check token cost before running `pnpm test:e2e`.

---

![CI](https://img.shields.io/badge/CI-pending-lightgrey) ![Coverage](https://img.shields.io/badge/coverage-0%25-red)

_End of README.md_
