import type { Metric } from '../types.js';

const exactMatch: Metric = {
  async evaluate({ prediction, references }) {
    const match = references.some((r) => r === prediction);
    return { score: match ? 1 : 0 };
  },
};

export default exactMatch;
