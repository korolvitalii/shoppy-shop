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
});
