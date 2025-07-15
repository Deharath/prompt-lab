import { useEffect } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  timestamp: number;
}

export const usePerformanceMonitoring = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 100) {
        console.warn(
          `Slow render detected in ${componentName}: ${renderTime}ms`,
        );
      }

      const metrics: PerformanceMetrics = {
        componentName,
        renderTime,
        timestamp: Date.now(),
      };

      // Future: Could send to analytics service
      // analytics.track('component_render', metrics);
    };
  }, [componentName]);
};
