import { HttpErrorResponse } from '@angular/common/http';

import { APP_ERROR_CODES, AppError, normalizeError } from './app-error';

describe('normalizeError', () => {
  it.each([
    [0, APP_ERROR_CODES.network],
    [401, APP_ERROR_CODES.unauthorized],
    [404, APP_ERROR_CODES.notFound],
    [429, APP_ERROR_CODES.rateLimited],
    [503, APP_ERROR_CODES.server],
  ])('maps HTTP status %i to %s', (status, code) => {
    const error = normalizeError(new HttpErrorResponse({ status }));

    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe(code);
    expect(error.userMessage).not.toContain('Http failure');
  });

  it('does not expose an unexpected error message to the user', () => {
    const error = normalizeError(new Error('Database password leaked'));

    expect(error.code).toBe(APP_ERROR_CODES.unknown);
    expect(error.userMessage).toBe('Something went wrong. Please try again.');
  });

  it('surfaces the API-provided detail for a 4xx ProblemDetails response', () => {
    const error = normalizeError(
      new HttpErrorResponse({ status: 401, error: { detail: 'Invalid email or password.' } }),
    );

    expect(error.userMessage).toBe('Invalid email or password.');
  });

  it('flattens field-level validation errors from a ProblemDetails response', () => {
    const error = normalizeError(
      new HttpErrorResponse({
        status: 400,
        error: {
          errors: {
            PasswordTooShort: ['Passwords must be at least 10 characters.'],
            PasswordRequiresUpper: ["Passwords must have at least one uppercase ('A'-'Z')."],
          },
        },
      }),
    );

    expect(error.userMessage).toBe(
      "Passwords must be at least 10 characters. Passwords must have at least one uppercase ('A'-'Z').",
    );
  });

  it('falls back to the generic bucketed message for a 5xx response even with a detail', () => {
    const error = normalizeError(
      new HttpErrorResponse({ status: 503, error: { detail: 'Internal database details' } }),
    );

    expect(error.userMessage).toBe(
      'Our service is temporarily unavailable. Please try again shortly.',
    );
  });
});
