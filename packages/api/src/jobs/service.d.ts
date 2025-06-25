import { Job, NewJob } from '../db/schema';
export declare function createJob(data: Omit<NewJob, 'id' | 'status'>): Promise<Job>;
export declare function getJob(id: string): Promise<Job | undefined>;
export declare function updateJob(id: string, data: Partial<Omit<Job, 'id' | 'createdAt'>>): Promise<Job>;
