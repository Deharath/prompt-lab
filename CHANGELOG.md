# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Multi-model support for GPT-4.1 (full, mini, nano) and Gemini 2.5 Flash
- Automated evaluation with embedding-cosine, exact-match & length heuristics
- Cost & latency tracking for all model runs
- React UI with history pane and real-time updates
- CI/CD pipeline with quality gates
- Comprehensive test suite with >90% coverage
- TypeScript monorepo with strict typing
- Pre-commit hooks for code quality
- EditorConfig for consistent formatting

### Changed

- Refactored test architecture for better isolation
- Consolidated duplicate configuration files
- Improved test reliability and removed flakiness

### Removed

- Duplicate Vitest and Vite configuration files
- Legacy ESLint configuration (`.eslintrc.js`)
- Tracked SQLite database files
- Unused dependencies and empty test files

## [0.1.0] - 2025-06-27

### Added

- Initial MVP release
- Basic prompt testing framework
- Model provider integrations
- Web interface
- API backend
- Evaluation framework
