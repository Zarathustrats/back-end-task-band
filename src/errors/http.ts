import { ZodError } from 'zod';

export class HttpError extends Error {
  httpCode: number;
  data?: Record<string, any>;

  constructor(message: string, httpCode = 500, data: Record<string, any> = {}) {
    super(message);

    this.httpCode = httpCode;
    this.data = data;
  }

  static fromError(error: Error): HttpError {
    const result =
      error instanceof ZodError
        ? new HttpError('Invalid request', 400, { issues: error.issues })
        : new HttpError(error.message);

    result.name = error.name;
    result.stack = error.stack;

    return result;
  }
}
