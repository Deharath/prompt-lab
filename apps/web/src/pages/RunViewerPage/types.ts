import type { JobDetails } from '../../api.js';

export interface RunViewerState {
  job: JobDetails | null;
  loading: boolean;
  error: string | null;
  darkMode: boolean;
}

export { type JobDetails };
