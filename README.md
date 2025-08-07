# Prompt Lab

An advanced environment for testing and evaluating AI models and prompts.

## Overview

Prompt Lab is a modern platform for prompt engineering and AI model evaluation. Built with React, TypeScript, and Node.js, it enables systematic development, testing, and optimization of prompts across multiple AI providers while tracking performance metrics and costs in real-time.

## Vision

Prompt Lab addresses the critical challenges in prompt engineering by providing a unified, model-agnostic platform that streamlines the development lifecycle. Whether you're optimizing for performance, cost-effectiveness, or specific quality metrics, Prompt Lab provides the tools and insights needed to make data-driven decisions in your AI workflow.

## Core Features

### Model Integration

- **Multi-Provider Support:** Seamless integration with OpenAI, Google Gemini, Anthropic Claude, and extensible architecture for additional providers
- **Unified Interface:** Consistent API abstraction across different AI models and providers
- **Authentication Management:** Secure API key handling and provider-specific configuration

### Prompt Development

- **Template System:** Create, organize, and version reusable prompt templates with variable substitution
- **Live Testing:** Real-time prompt testing with immediate feedback and iteration capabilities
- **Parameter Tuning:** Fine-tune model parameters (temperature, max tokens, etc.) with visual controls

### Evaluation Framework

- **Automated Metrics:** Built-in evaluation metrics including sentiment analysis, readability scores, and custom quality assessments
- **Side-by-Side Comparison:** Compare outputs from different models or prompt variations in a unified interface
- **Job History:** View and manage previous evaluation runs with status tracking
- **Real-time Results:** Live streaming of evaluation results with immediate feedback

### Performance Monitoring

- **Cost Tracking:** Real-time monitoring of API usage costs across providers with detailed breakdowns
- **Latency Metrics:** Track response times and identify performance bottlenecks
- **Token Usage:** Monitor token consumption patterns and optimize for efficiency
- **Quality Scoring:** Comprehensive quality metrics including readability, sentiment, and keyword analysis

### Data Management

- **Share Functionality:** Share evaluation runs with teammates via secure links
- **Data Persistence:** Reliable SQLite storage for prompts, jobs, and evaluation results
- **Job Management:** Create, view, and delete evaluation jobs with comprehensive status tracking
- **Settings Storage:** Persistent storage of model configurations and user preferences

## Tech Stack

- **Framework:** React (Vite)
- **UI:** Tailwind CSS, Shadcn UI
- **Language:** TypeScript
- **Backend:** Node.js, Express.js
- **Database:** SQLite with Drizzle ORM
- **Testing:** Vitest, Playwright
- **Linting/Formatting:** ESLint, Prettier
- **CI/CD:** GitHub Actions
- **Containerization:** Docker

## Architecture

Prompt Lab follows a modern monorepo architecture designed for scalability and maintainability:

### Frontend (apps/web)

- **React Application:** Built with Vite for fast development and optimized production builds
- **State Management:** Zustand for lightweight, type-safe state management
- **UI Components:** Tailwind CSS with Shadcn UI for consistent, accessible design
- **Real-time Updates:** Server-Sent Events (SSE) for live prompt evaluation feedback

### Backend (apps/api)

- **REST API:** Express.js-based API with comprehensive error handling and validation
- **Rate Limiting:** Built-in rate limiting and request throttling for API protection
- **Authentication:** Secure API key management and provider authentication
- **Health Monitoring:** Comprehensive health checks and monitoring endpoints

### Packages

- **evaluation-engine:** Core evaluation logic with pluggable metrics system and AI provider integrations
- **shared-types:** Shared TypeScript type definitions across the monorepo

## Monorepo Structure

This project is a monorepo managed with `pnpm` workspaces, providing efficient dependency management and build orchestration.

```
prompt-lab/
├── apps/
│   ├── web/          # React frontend application
│   └── api/          # Express.js backend API
├── packages/
│   ├── evaluation-engine/  # Core evaluation framework and AI providers
│   └── shared-types/       # Shared TypeScript definitions
└── scripts/               # Build and deployment scripts
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm
- Docker (optional, for deployment)

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Deharath/prompt-lab.git
    cd prompt-lab
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up environment variables (local only):**

    Copy the template to a local, untracked file and add your keys:

    ```bash
    cp .env.example .env.local
    ```

    Then edit `.env.local`:

    ```bash
    OPENAI_API_KEY=your_openai_api_key_here
    GEMINI_API_KEY=your_gemini_api_key_here
    ANTHROPIC_API_KEY=your_anthropic_api_key_here
    ```

    Notes:
    - `.env.local` is git‑ignored and overrides `.env` in development/test.
    - In production, the app does not read files; inject env via your platform.

4.  **Initialize the database:**

    ```bash
    pnpm migrate
    ```

5.  **Start the development servers:**

    ```bash
    pnpm dev
    ```

    This starts both the web application (http://localhost:5173) and the API server (http://localhost:3000) concurrently.

### Docker Deployment

For production deployment using Docker:

```bash
# Build the Docker image
docker build -t prompt-lab .

# Run the container
docker run -d -p 3000:3000 \
  -e OPENAI_API_KEY=your_key \
  -e GEMINI_API_KEY=your_key \
  -e ANTHROPIC_API_KEY=your_key \
  prompt-lab
```

## Usage

### Basic Workflow

1. **Configure Providers:** Set up your AI provider API keys in the environment configuration
2. **Create Prompts:** Use the prompt editor to create and template your prompts
3. **Set Parameters:** Configure model parameters (temperature, max tokens, etc.)
4. **Run Evaluations:** Execute prompts and compare results across different models
5. **Analyze Results:** Review metrics, costs, and performance data
6. **Iterate:** Refine prompts based on evaluation feedback

### Advanced Features

- **Custom Prompt Templates:** Pre-built templates for common use cases like summarization, sentiment analysis, and code review
- **Custom Metrics:** Define custom evaluation criteria specific to your use case with flexible metric plugins
- **Real-time Streaming:** Live evaluation results with Server-Sent Events for immediate feedback
- **Cost Optimization:** Monitor and optimize API usage costs across providers with detailed pricing breakdowns

## Development

### Scripts

- `pnpm dev` - Start development servers (web + api)
- `pnpm build` - Build all packages for production
- `pnpm test` - Run test suite with coverage
- `pnpm lint` - Run ESLint across all packages
- `pnpm format` - Format code with Prettier
- `pnpm tsc` - Type check all TypeScript code
- `pnpm clean` - Clean build artifacts and dependencies

### Testing

The project includes comprehensive testing:

- **Unit Tests:** Individual component and function testing
- **Integration Tests:** API and database integration testing
- **End-to-End Tests:** Full workflow testing with Playwright
- **Coverage Reporting:** Automated test coverage tracking

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## License

This project is licensed under the [MIT License](LICENSE).
