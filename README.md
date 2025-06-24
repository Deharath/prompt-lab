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
