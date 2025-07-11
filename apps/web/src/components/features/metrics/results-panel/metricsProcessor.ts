/**
 * Legacy metrics processor - now just re-exports centralized processor
 * This file maintained for backward compatibility
 */

import { processMetrics as centralizedProcessMetrics } from '../../../../lib/metrics/processor.js';

export const processMetrics = (metrics: Record<string, unknown>) => {
  // Convert new format to legacy format for backward compatibility
  const processed = centralizedProcessMetrics(metrics, {
    groupByCategory: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Convert to legacy format expected by existing components
  const categories: Record<
    string,
    Array<[string, string, string?, string?, unknown?, string?, boolean?]>
  > = {
    quality: [],
    readability: [],
    sentiment: [],
    content: [],
    technical: [],
  };

  // Map new categories to legacy category names
  const categoryMapping: Record<string, string> = {
    QUALITY: 'quality',
    READABILITY: 'readability',
    SENTIMENT: 'sentiment',
    STRUCTURE: 'content',
    CONTENT: 'content',
    KEYWORDS: 'content',
    VALIDATION: 'technical',
    PERFORMANCE: 'technical',
    CUSTOM: 'technical',
  };

  processed.groups.forEach((group: any) => {
    const legacyCategory = categoryMapping[group.category] || 'technical';

    group.items.forEach((item: any) => {
      categories[legacyCategory].push([
        item.name,
        item.value,
        item.unit,
        item.description,
        item.originalValue,
        item.originalKey,
        item.isDisabled,
      ]);
    });
  });

  return categories;
};
