import type { Metric } from '../types.js';

const exactMatch: Metric = {
  async evaluate({ prediction, references }) {
    return {
      score: references.some((r: string) => r === prediction) ? 1 : 0,
    };
  },
};

export default exactMatch;
