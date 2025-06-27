# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Pre-commit hooks with Husky and lint-staged for automated code quality
- EditorConfig for consistent formatting across editors
- Comprehensive GitHub issue and PR templates
- CHANGELOG.md following Keep a Changelog format
- Security audit and dependency checks in CI pipeline
- Automated dependency update workflow via GitHub Actions
- Professional README with badges, setup instructions, and contribution guidelines
- Scripts for security auditing, dependency checking, and updates
- Consolidated cosine similarity utility function
- Complete API architecture refactoring with shared `@prompt-lab/api` package
- Streaming job execution with Server-Sent Events (SSE)
- Real-time job status tracking and progress monitoring
- Unified provider interface for OpenAI and Gemini models
- Job persistence with SQLite and Drizzle ORM
- Documentation overhaul with current architecture and environment setup

### Changed

- Enhanced CI/CD pipeline with security and dependency checks
- Refactored test architecture for better isolation and reliability
- Updated README with comprehensive documentation and project status
- Migrated from legacy `.eslintrc.js` to modern flat config format
- Improved test setup to use in-memory databases for isolation
- **MAJOR**: Consolidated API architecture into shared `packages/api` library
- Unified provider implementations under single interface
- Moved job service logic to shared package for reusability
- Enhanced job processing with real-time streaming capabilities

### Fixed

- E2E test flakiness and architecture issues
- Test isolation problems between package and app-level tests
- All tests now pass consistently (40/40) without workarounds

### Removed

- Tracked SQLite database files (added to .gitignore)
- Duplicate configuration files (vitest.config.js, vite.config.js, drizzle.config.js)
- Legacy ESLint configuration (`.eslintrc.js`)
- Unused dependencies from packages/evaluator
- Empty and redundant test files
- Duplicate job route implementation
- **MAJOR**: Eliminated code duplication between `apps/api` and `packages/api`
- Duplicate provider implementations (consolidated into shared package)
- Redundant database and job service logic from apps/api
- Outdated documentation files (CLEANUP_SUMMARY.md, ENVIRONMENT.md)

## [0.1.0] - 2025-06-27

### Added

- Initial MVP release with comprehensive cleanup and modernization
- Basic prompt testing framework with streaming execution
- Model provider integrations (OpenAI GPT-4 series, Gemini 2.5 Flash)
- React web interface with real-time job monitoring
- Express API backend with rate limiting and validation
- Evaluation framework with cosine similarity and exact match metrics
- Complete monorepo setup with TypeScript project references
- Production-ready Docker containerization
- Comprehensive test suite (40+ tests) with 100% evaluator coverage

## [0.2.0] - TBD

### Planned

- Frontend modernization with `/jobs` API integration
- EventSource streaming for real-time UI updates
- Job history and diff comparison views
- Enhanced metrics pack (Rouge-L, toxicity detection, regex validation)
- Cost tracking and usage analytics

## [0.3.0]

### Planned

- Complete "scientific method" for LLM prompting
- Production-ready prompt playground with streaming interface
- Advanced metrics and evaluation capabilities
- CI/CD integration templates and examples
- Comprehensive documentation and deployment guides
