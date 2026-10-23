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

  it('translates a stable API code without displaying server prose', () => {
    const error = normalizeError(
      new HttpErrorResponse({
        status: 401,
        error: { code: 'auth.invalid_credentials', detail: 'Untranslated server prose' },
      }),
    );

    expect(error.userMessage).toBe('Invalid email or password.');
  });

  it('preserves specific guidance from structured validation issue codes', () => {
    const error = normalizeError(
      new HttpErrorResponse({
        status: 400,
        error: {
          validationIssues: [
            { field: 'password', code: 'identity.PasswordTooShort', parameters: { minimum: 10 } },
            { field: 'password', code: 'identity.PasswordRequiresUpper' },
          ],
        },
      }),
    );

    expect(error.userMessage).toBe(
      'Passwords must contain at least 10 characters. Include an uppercase letter in your password.',
    );
  });

  it('uses the 400 fallback when the API omits the password minimum', () => {
    const error = normalizeError(
      new HttpErrorResponse({
        status: 400,
        error: {
          validationIssues: [{ field: 'password', code: 'identity.PasswordTooShort' }],
        },
      }),
    );

    expect(error.userMessage).toBe(
      'Some information was not accepted. Check your details and try again.',
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
  it('uses a localized fallback for unrecognized codes and legacy English errors', () => {
    for (const body of [
      { detail: 'English server prose' },
      { code: 'future.code', errors: { password: ['English rule'] } },
    ]) {
      const error = normalizeError(new HttpErrorResponse({ status: 400, error: body }));
      expect(error.userMessage).toBe(
        'Some information was not accepted. Check your details and try again.',
      );
    }
  });
});
