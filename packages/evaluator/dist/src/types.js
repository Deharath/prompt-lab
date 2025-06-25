import { z } from 'zod';
export const metricArgsSchema = z.object({
    prediction: z.string(),
    references: z.array(z.string()).nonempty(),
});
export const metricResultSchema = z.object({
    score: z.number(),
    explanation: z.string().optional(),
});
