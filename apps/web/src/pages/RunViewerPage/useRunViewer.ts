import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiClient } from '../../api.js';
import type { JobDetails } from './types.js';

export const useRunViewer = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('prompt-lab-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Apply dark mode to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('prompt-lab-dark-mode', JSON.stringify(!darkMode));
  };

  return {
    job,
    loading,
    error,
    darkMode,
    toggleDarkMode,
  };
};
