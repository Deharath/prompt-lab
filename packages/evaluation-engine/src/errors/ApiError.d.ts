export declare class ApiError extends Error {
  statusCode: number;
  code?: string | undefined;
  constructor(message: string, statusCode: number, code?: string | undefined);
}
export declare class ServiceUnavailableError extends ApiError {
  constructor(message: string);
}
