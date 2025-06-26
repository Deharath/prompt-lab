import { promises as fs } from 'fs';
import type { Job } from './schema.js';

const DB_FILE = process.env.DATABASE_URL || 'jobs.json';

export class JobDatabase {
  private jobs: Job[] = [];

  private initialized = false;

  async init() {
    if (this.initialized) return;

    try {
      const data = await fs.readFile(DB_FILE, 'utf-8');
      this.jobs = JSON.parse(data).map((job: Record<string, unknown>) => ({
        ...job,
        createdAt: new Date(job.createdAt as string),
        updatedAt: new Date(job.updatedAt as string),
      }));
    } catch (_error) {
      // File doesn't exist or is invalid, start with empty array
      this.jobs = [];
    }

    this.initialized = true;
  }

  async save() {
    await this.init();
    try {
      await fs.writeFile(DB_FILE, JSON.stringify(this.jobs, null, 2));
    } catch (error) {
      console.error('Failed to save jobs database:', error);
      throw new Error('Database save operation failed');
    }
  }

  async create(job: Job): Promise<Job> {
    await this.init();
    this.jobs.push(job);
    await this.save();
    return job;
  }

  async findById(id: string): Promise<Job | undefined> {
    await this.init();
    return this.jobs.find((job) => job.id === id);
  }

  async update(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    await this.init();
    const index = this.jobs.findIndex((job) => job.id === id);
    if (index === -1) return undefined;

    this.jobs[index] = {
      ...this.jobs[index],
      ...updates,
      updatedAt: new Date(),
    };
    await this.save();
    return this.jobs[index];
  }

  async deleteAll(): Promise<void> {
    this.jobs = [];
    await this.save();
  }
}

export const db = new JobDatabase();
