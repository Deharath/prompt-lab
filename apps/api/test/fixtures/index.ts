import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load fixture data from a file
 */
export function loadFixture(filename: string): string {
  const fixturePath = join(__dirname, filename);
  return readFileSync(fixturePath, 'utf-8');
}

/**
 * Load and parse JSONL fixture data
 */
export function loadJsonlFixture(filename: string): unknown[] {
  const content = loadFixture(filename);
  return content
    .trim()
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}
