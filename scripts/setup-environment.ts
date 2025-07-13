#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import os from 'os';

type Platform = 'win32' | 'linux' | 'darwin' | 'unknown';
type Environment = 'windows' | 'wsl' | 'linux' | 'macos' | 'unknown';

interface EnvironmentInfo {
  platform: Platform;
  environment: Environment;
  isWSL: boolean;
  nodeVersion: string;
  pnpmVersion: string | null;
  workingDirectory: string;
}

class EnvironmentSetup {
  private info: EnvironmentInfo;

  constructor() {
    this.info = this.detectEnvironment();
  }

  private detectEnvironment(): EnvironmentInfo {
    const platform = os.platform() as Platform;
    let environment: Environment = 'unknown';
    let isWSL = false;

    // Detect WSL
    if (platform === 'linux') {
      try {
        const release = readFileSync('/proc/version', 'utf8');
        if (release.includes('Microsoft') || release.includes('WSL')) {
          isWSL = true;
          environment = 'wsl';
        } else {
          environment = 'linux';
        }
      } catch {
        environment = 'linux';
      }
    } else if (platform === 'win32') {
      environment = 'windows';
    } else if (platform === 'darwin') {
      environment = 'macos';
    }

    const nodeVersion = process.version;
    let pnpmVersion: string | null = null;

    try {
      pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
    } catch {
      // pnpm not installed
    }

    return {
      platform,
      environment,
      isWSL,
      nodeVersion,
      pnpmVersion,
      workingDirectory: process.cwd(),
    };
  }

  private log(
    message: string,
    type: 'info' | 'warn' | 'error' | 'success' = 'info',
  ) {
    const colors = {
      info: '\x1b[36m', // cyan
      warn: '\x1b[33m', // yellow
      error: '\x1b[31m', // red
      success: '\x1b[32m', // green
      reset: '\x1b[0m',
    };

    const prefix = {
      info: 'ℹ',
      warn: '⚠',
      error: '✗',
      success: '✓',
    };

    console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
  }

  private executeCommand(command: string, description: string): boolean {
    try {
      this.log(`${description}...`, 'info');
      execSync(command, { stdio: 'inherit', cwd: this.info.workingDirectory });
      this.log(`${description} completed`, 'success');
      return true;
    } catch (error) {
      this.log(`${description} failed: ${error}`, 'error');
      return false;
    }
  }

  private checkAndFixNpmrc(): void {
    const npmrcPath = path.join(this.info.workingDirectory, '.npmrc');
    const requiredConfig = [
      'node-linker=hoisted',
      'shamefully-hoist=true',
      'package-import-method=copy',
      'symlink=false',
    ];

    let currentConfig = '';
    if (existsSync(npmrcPath)) {
      currentConfig = readFileSync(npmrcPath, 'utf8');
    }

    const missingConfig = requiredConfig.filter(
      (line) => !currentConfig.includes(line),
    );

    if (missingConfig.length > 0) {
      this.log('Updating .npmrc with cross-platform configuration', 'info');
      const newConfig =
        currentConfig.trim() + '\n' + missingConfig.join('\n') + '\n';
      writeFileSync(npmrcPath, newConfig);
      this.log('.npmrc updated successfully', 'success');
    } else {
      this.log('.npmrc configuration is already correct', 'success');
    }
  }

  private ensureEnvFile(): void {
    const envPath = path.join(this.info.workingDirectory, '.env');
    const exampleEnvPath = path.join(
      this.info.workingDirectory,
      '.env.example',
    );

    if (!existsSync(envPath) && existsSync(exampleEnvPath)) {
      this.log('Creating .env from .env.example', 'info');
      const exampleContent = readFileSync(exampleEnvPath, 'utf8');
      writeFileSync(envPath, exampleContent);
      this.log('.env file created', 'success');
    } else if (existsSync(envPath)) {
      this.log('.env file already exists', 'success');
    } else {
      this.log('No .env.example found, skipping .env creation', 'warn');
    }
  }

  private cleanNodeModules(): boolean {
    const nodeModulesPath = path.join(
      this.info.workingDirectory,
      'node_modules',
    );

    if (existsSync(nodeModulesPath)) {
      this.log('Cleaning node_modules for fresh installation', 'info');
      return this.executeCommand('pnpm clean', 'Clean workspace');
    }

    return true;
  }

  public displayEnvironmentInfo(): void {
    this.log('Environment Detection Results:', 'info');
    console.log(`  Platform: ${this.info.platform}`);
    console.log(`  Environment: ${this.info.environment}`);
    console.log(`  WSL: ${this.info.isWSL ? 'Yes' : 'No'}`);
    console.log(`  Node.js: ${this.info.nodeVersion}`);
    console.log(`  pnpm: ${this.info.pnpmVersion || 'Not installed'}`);
    console.log(`  Working Directory: ${this.info.workingDirectory}`);
    console.log('');
  }

  public async setupEnvironment(force: boolean = false): Promise<boolean> {
    this.displayEnvironmentInfo();

    if (!this.info.pnpmVersion) {
      this.log('pnpm is not installed. Please install pnpm first:', 'error');
      this.log('npm install -g pnpm@10.12.3', 'info');
      return false;
    }

    // Check if we're in a problematic environment transition
    const needsCleanInstall =
      force ||
      (this.info.isWSL &&
        existsSync(
          path.join(this.info.workingDirectory, 'node_modules', '.pnpm'),
        )) ||
      (this.info.environment === 'windows' &&
        existsSync(
          path.join(this.info.workingDirectory, 'node_modules', '.bin'),
        ));

    this.log(
      'Setting up robust cross-platform development environment',
      'info',
    );

    // Step 1: Ensure correct .npmrc configuration
    this.checkAndFixNpmrc();

    // Step 2: Ensure .env file exists
    this.ensureEnvFile();

    // Step 3: Clean install if needed
    if (needsCleanInstall) {
      this.log('Detected potential cross-platform dependency issues', 'warn');
      if (!this.cleanNodeModules()) {
        return false;
      }
    }

    // Step 4: Install dependencies
    if (!this.executeCommand('pnpm install', 'Install dependencies')) {
      return false;
    }

    // Step 5: Build shared types and packages
    if (
      !this.executeCommand(
        'pnpm --filter @prompt-lab/shared-types build',
        'Build shared types',
      )
    ) {
      return false;
    }

    if (!this.executeCommand('pnpm -r build', 'Build all packages')) {
      return false;
    }

    // Step 6: Run migrations
    if (!this.executeCommand('pnpm migrate', 'Run database migrations')) {
      this.log('Migration failed, but continuing setup', 'warn');
    }

    // Step 7: Validate setup
    if (!this.executeCommand('pnpm tsc', 'Validate TypeScript compilation')) {
      this.log('TypeScript validation failed', 'warn');
    }

    this.log('Environment setup completed successfully!', 'success');
    this.log('You can now run: pnpm dev', 'info');

    return true;
  }

  public checkEnvironmentHealth(): boolean {
    this.log('Checking environment health...', 'info');

    const checks = [
      { name: 'pnpm available', command: 'pnpm --version' },
      { name: 'TypeScript compilation', command: 'pnpm tsc' },
      { name: 'Linting', command: 'pnpm lint' },
      { name: 'Tests', command: 'pnpm test' },
    ];

    let allPassed = true;

    for (const check of checks) {
      try {
        execSync(check.command, {
          stdio: 'pipe',
          cwd: this.info.workingDirectory,
        });
        this.log(`${check.name}: PASS`, 'success');
      } catch (error) {
        this.log(`${check.name}: FAIL`, 'error');
        allPassed = false;
      }
    }

    return allPassed;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const setup = new EnvironmentSetup();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Environment Setup Tool

Usage:
  node setup-environment.ts [options]

Options:
  --force    Force clean installation (removes node_modules)
  --check    Only check environment health
  --info     Display environment information only
  --help     Show this help message

Examples:
  node setup-environment.ts               # Standard setup
  node setup-environment.ts --force       # Force clean setup
  node setup-environment.ts --check       # Health check only
    `);
    return;
  }

  if (args.includes('--info')) {
    setup.displayEnvironmentInfo();
    return;
  }

  if (args.includes('--check')) {
    const isHealthy = setup.checkEnvironmentHealth();
    process.exit(isHealthy ? 0 : 1);
    return;
  }

  const force = args.includes('--force');
  const success = await setup.setupEnvironment(force);
  process.exit(success ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

export { EnvironmentSetup };
