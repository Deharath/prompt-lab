# Prompt Lab

An advanced environment for testing and evaluating AI models and prompts.

## Vision

Prompt Lab is designed to be a comprehensive, model-agnostic platform for prompt engineering. It provides a suite of tools to streamline the development, testing, and evaluation of prompts for various AI models, helping developers and researchers optimize for performance, cost, and quality.

## Core Features

- **Model Agnostic:** Connect to various AI provider APIs (e.g., OpenAI, Anthropic, Google) with a unified interface.
- **Prompt Templating:** Create and manage a library of reusable prompt templates.
- **Side-by-Side Evaluation:** Compare responses from different models or prompts in a user-friendly interface.
- **Automated Evaluation:** Define metrics and run automated evaluations to score prompt performance.
- **History & Versioning:** Track changes to your prompts and review evaluation history.
- **Cost Tracking:** Monitor token usage and estimate costs across different models.

## Tech Stack

- **Framework:** React (Vite)
- **UI:** Tailwind CSS, Shadcn UI
- **Language:** TypeScript
- **Backend:** Node.js, Hono
- **Database:** Turso (SQLite) with Drizzle ORM
- **Testing:** Vitest, Playwright
- **Linting/Formatting:** ESLint, Prettier
- **CI/CD:** GitHub Actions
- **Containerization:** Docker

## Monorepo Structure

This project is a monorepo managed with `pnpm` workspaces.

- `apps/web`: The main web interface for Prompt Lab.
- `apps/api`: The backend API that powers the web app.
- `packages/evaluation-engine`: The core logic for evaluating model responses.
- `packages/db`: Shared database schemas and utilities.
- `packages/providers`: Connectors for different AI model providers.
- ... and more.

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- pnpm
- Docker

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/prompt-lab.git
    cd prompt-lab
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Copy the `.env.example` file to a new `.env` file and fill in the required API keys and configuration.

    ```bash
    cp .env.example .env
    ```

4.  **Run the development servers:**
    This will start the web app and the API concurrently.
    ```bash
    pnpm dev
    ```

The web application will be available at `http://localhost:5173`.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## License

This project is licensed under the [MIT License](LICENSE).
