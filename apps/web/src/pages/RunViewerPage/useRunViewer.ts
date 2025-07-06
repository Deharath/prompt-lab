import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiClient } from '../../api.js';
import { useDarkModeStore } from '../../store/darkModeStore.js';
import type { JobDetails } from './types.js';

export const useRunViewer = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode, toggleDarkMode } = useDarkModeStore();

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const loadJob = async () => {
      if (!id) {
        setError('Job ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const jobData = await ApiClient.fetchJob(id);
        setJob(jobData);

        // Set page title
        if (jobData.prompt) {
          const truncatedPrompt =
            jobData.prompt.length > 48
              ? `${jobData.prompt.slice(0, 48)}…`
              : jobData.prompt;
          document.title = `Run · ${truncatedPrompt}`;
        } else {
          document.title = `Run · ${id}`;
        }
      } catch (err) {
        console.error('Failed to load job:', err);
        setError('Run not found');
        document.title = 'Run not found';
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [id]);

  return {
    job,
    loading,
    error,
  };
};
