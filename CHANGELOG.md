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

### Changed

- Enhanced CI/CD pipeline with security and dependency checks
- Refactored test architecture for better isolation and reliability
- Updated README with comprehensive documentation and project status
- Migrated from legacy `.eslintrc.js` to modern flat config format
- Improved test setup to use in-memory databases for isolation

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

## [0.1.0] - 2025-06-27

### Added

- Initial MVP release
- Basic prompt testing framework
- Model provider integrations
- Web interface
- API backend
- Evaluation framework
