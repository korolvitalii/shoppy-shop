import { HttpErrorResponse } from '@angular/common/http';

export const APP_ERROR_CODES = {
  network: 'NETWORK_ERROR',
  badRequest: 'BAD_REQUEST',
  unauthorized: 'UNAUTHORIZED',
  forbidden: 'FORBIDDEN',
  notFound: 'NOT_FOUND',
  conflict: 'CONFLICT',
  rateLimited: 'RATE_LIMITED',
  server: 'SERVER_ERROR',
  unknown: 'UNKNOWN_ERROR',
} as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES];

const messages: Record<AppErrorCode, string> = {
  NETWORK_ERROR: 'We could not connect. Check your internet connection and try again.',
  BAD_REQUEST: 'Some information was not accepted. Check your details and try again.',
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested information could not be found.',
  CONFLICT: 'This request conflicts with a recent change. Refresh and try again.',
  RATE_LIMITED: 'Too many requests were made. Please wait a moment and try again.',
  SERVER_ERROR: 'Our service is temporarily unavailable. Please try again shortly.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

export class AppError extends Error {
  override readonly name = 'AppError';

  constructor(
    readonly code: AppErrorCode,
    readonly userMessage: string,
    readonly status: number | null = null,
    readonly retryable = false,
    options?: ErrorOptions,
  ) {
    super(userMessage, options);
  }
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof HttpErrorResponse) {
    const code = codeFromStatus(error.status);
    return new AppError(code, messages[code], error.status, isRetryable(error.status), {
      cause: error,
    });
  }

  return new AppError(APP_ERROR_CODES.unknown, messages.UNKNOWN_ERROR, null, false, {
    cause: error,
  });
}

export function errorMessage(error: unknown): string {
  return normalizeError(error).userMessage;
}

function codeFromStatus(status: number): AppErrorCode {
  if (status === 0) return APP_ERROR_CODES.network;
  if (status === 400 || status === 422) return APP_ERROR_CODES.badRequest;
  if (status === 401) return APP_ERROR_CODES.unauthorized;
  if (status === 403) return APP_ERROR_CODES.forbidden;
  if (status === 404) return APP_ERROR_CODES.notFound;
  if (status === 409) return APP_ERROR_CODES.conflict;
  if (status === 429) return APP_ERROR_CODES.rateLimited;
  if (status >= 500) return APP_ERROR_CODES.server;
  return APP_ERROR_CODES.unknown;
}

function isRetryable(status: number): boolean {
  return status === 0 || status === 408 || status === 429 || status >= 500;
}
