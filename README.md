# Prompt Lab

An advanced environment for testing and evaluating AI models and prompts.

## Overview

Prompt Lab is a comprehensive, production-ready platform designed for prompt engineering and AI model evaluation. Built with modern web technologies and a microservices architecture, it enables developers, researchers, and organizations to systematically develop, test, and optimize prompts across multiple AI providers while tracking performance metrics and costs.

## Vision

Prompt Lab addresses the critical challenges in prompt engineering by providing a unified, model-agnostic platform that streamlines the development lifecycle. Whether you're optimizing for performance, cost-effectiveness, or specific quality metrics, Prompt Lab provides the tools and insights needed to make data-driven decisions in your AI workflow.

## Core Features

### Model Integration

- **Multi-Provider Support:** Seamless integration with OpenAI, Google Gemini, and extensible architecture for additional providers
- **Unified Interface:** Consistent API abstraction across different AI models and providers
- **Authentication Management:** Secure API key handling and provider-specific configuration

### Prompt Development

- **Template System:** Create, organize, and version reusable prompt templates with variable substitution
- **Live Testing:** Real-time prompt testing with immediate feedback and iteration capabilities
- **Parameter Tuning:** Fine-tune model parameters (temperature, max tokens, etc.) with visual controls

### Evaluation Framework

- **Automated Metrics:** Built-in evaluation metrics including sentiment analysis, readability scores, and custom quality assessments
- **Side-by-Side Comparison:** Compare outputs from different models or prompt variations in a unified interface
- **Batch Processing:** Run evaluations across multiple test cases and prompts simultaneously
- **Historical Analysis:** Track performance trends and model behavior over time

### Performance Monitoring

- **Cost Tracking:** Real-time monitoring of API usage costs across providers with detailed breakdowns
- **Latency Metrics:** Track response times and identify performance bottlenecks
- **Token Usage:** Monitor token consumption patterns and optimize for efficiency
- **Quality Scoring:** Comprehensive quality metrics including readability, sentiment, and keyword analysis

### Data Management

- **Version Control:** Full versioning of prompts, configurations, and evaluation results
- **Export Capabilities:** Export results in multiple formats for further analysis or reporting
- **Search and Filtering:** Advanced search and filtering capabilities for large datasets
- **Data Persistence:** Reliable data storage with backup and recovery options

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

## Architecture

Prompt Lab follows a modern microservices architecture designed for scalability and maintainability:

### Frontend (apps/web)

- **React Application:** Built with Vite for fast development and optimized production builds
- **State Management:** Zustand for lightweight, type-safe state management
- **UI Components:** Tailwind CSS with Shadcn UI for consistent, accessible design
- **Real-time Updates:** WebSocket integration for live prompt evaluation feedback

### Backend (apps/api)

- **REST API:** Express.js-based API with comprehensive error handling and validation
- **Rate Limiting:** Built-in rate limiting and request throttling for API protection
- **Authentication:** Secure API key management and provider authentication
- **Health Monitoring:** Comprehensive health checks and monitoring endpoints

### Packages

- **evaluation-engine:** Core evaluation logic with pluggable metrics system
- **evaluator:** High-level evaluation orchestration and result processing
- **providers:** Abstracted AI provider integrations with unified interface
- **db:** Database schema definitions and migration management
- **test-cases:** Comprehensive test suites and evaluation datasets

## Monorepo Structure

This project is a monorepo managed with `pnpm` workspaces, providing efficient dependency management and build orchestration.

```
prompt-lab/
├── apps/
│   ├── web/          # React frontend application
│   └── api/          # Express.js backend API
├── packages/
│   ├── evaluation-engine/  # Core evaluation framework
│   ├── evaluator/          # Evaluation orchestration
│   ├── providers/          # AI provider integrations
│   ├── db/                 # Database schemas and utilities
│   └── test-cases/         # Test data and evaluation cases
├── scripts/               # Build and deployment scripts
└── docs/                  # Additional documentation
```

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

    Copy the `.env.example` file to a new `.env` file and configure your API keys:

    ```bash
    cp .env.example .env
    ```

    Edit the `.env` file and add your API keys:

    ```bash
    OPENAI_API_KEY=your_openai_api_key_here
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

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

- **Batch Processing:** Upload CSV files with multiple test cases for bulk evaluation
- **Custom Metrics:** Define custom evaluation criteria specific to your use case
- **Historical Analysis:** Track performance trends and model behavior over time
- **Cost Optimization:** Monitor and optimize API usage costs across providers

## Development

### Scripts

- `pnpm dev` - Start development servers (web + api)
- `pnpm build` - Build all packages for production
- `pnpm test` - Run test suite with coverage
- `pnpm lint` - Run ESLint across all packages
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
