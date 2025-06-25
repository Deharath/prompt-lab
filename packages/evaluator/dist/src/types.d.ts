import { z } from 'zod';
export declare const metricArgsSchema: z.ZodObject<{
    prediction: z.ZodString;
    references: z.ZodArray<z.ZodString, "atleastone">;
}, "strip", z.ZodTypeAny, {
    prediction: string;
    references: [string, ...string[]];
}, {
    prediction: string;
    references: [string, ...string[]];
}>;
export declare const metricResultSchema: z.ZodObject<{
    score: z.ZodNumber;
    explanation: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    score: number;
    explanation?: string | undefined;
}, {
    score: number;
    explanation?: string | undefined;
}>;
export type MetricArgs = z.infer<typeof metricArgsSchema>;
export type MetricResult = z.infer<typeof metricResultSchema>;
export interface Metric {
    evaluate(args: MetricArgs): Promise<MetricResult>;
}
