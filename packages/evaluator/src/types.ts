import { z } from 'zod';

export const evalArgsSchema = z.object({
  prediction: z.string(),
  references: z.array(z.string()).nonempty(),
});

export type EvalArgs = z.infer<typeof evalArgsSchema>;

export const evalResultSchema = z.object({
  score: z.number(),
  explanation: z.string().optional(),
});

export type EvalResult = z.infer<typeof evalResultSchema>;

export interface Metric {
  evaluate(args: EvalArgs): Promise<EvalResult>;
}
