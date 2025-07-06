/**
 * Task 2 - Readability Service
 * Expose FRE, FK, SMOG via text-readability
 * Reject input > 20 kB with 413
 */
import { Request, Response, NextFunction } from 'express';
export interface ReadabilityScores {
  fleschReadingEase: number;
  fleschKincaid: number;
  smog: number;
  textLength: number;
}
export interface ReadabilityError {
  error: string;
  code: number;
}
/**
 * Middleware to check text size limit (20 kB)
 */
export declare function validateTextSize(
  req: Request,
  res: Response,
  next: NextFunction,
): void | Response<any, Record<string, any>>;
/**
 * Calculate readability scores using text-readability library
 */
export declare function calculateReadabilityScores(
  text: string,
): Promise<ReadabilityScores>;
/**
 * Express route handler for readability analysis
 */
export declare function readabilityHandler(
  req: Request,
  res: Response,
): Promise<Response<any, Record<string, any>> | undefined>;
