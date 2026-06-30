import { TestBed } from '@angular/core/testing';

import { APP_ERROR_CODES } from './app-error';
import { ErrorNotificationService } from './error-notification.service';
import { GlobalErrorHandler } from './global-error.handler';

describe('GlobalErrorHandler', () => {
  it('turns unexpected errors into a user-safe notification', () => {
    TestBed.configureTestingModule({ providers: [GlobalErrorHandler] });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const handler = TestBed.inject(GlobalErrorHandler);
    const notifications = TestBed.inject(ErrorNotificationService);

    handler.handleError(new Error('Sensitive implementation detail'));

    expect(notifications.current()?.code).toBe(APP_ERROR_CODES.unknown);
    expect(notifications.current()?.userMessage).not.toContain('Sensitive');
    expect(consoleError).toHaveBeenCalledOnce();
  });
});
