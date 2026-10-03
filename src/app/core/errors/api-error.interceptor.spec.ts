import { HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { apiErrorInterceptor } from './api-error.interceptor';
import { APP_ERROR_CODES, AppError } from './app-error';
import { SKIP_ERROR_NOTIFICATION, SKIP_ERROR_NOTIFICATION_STATUSES } from './error-context';
import { ErrorNotificationService } from './error-notification.service';

describe('apiErrorInterceptor', () => {
  it.each([404, 503])('only suppresses the configured notification statuses: %s', (status) => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    const notifications = TestBed.inject(ErrorNotificationService);
    const failed = vi.fn();

    http
      .get('/api/example', {
        context: new HttpContext().set(SKIP_ERROR_NOTIFICATION_STATUSES, [404]),
      })
      .subscribe({ error: failed });
    controller.expectOne('/api/example').flush(null, { status, statusText: 'Request failed' });

    expect(failed).toHaveBeenCalledWith(expect.any(AppError));
    expect(failed.mock.calls[0][0].status).toBe(status);
    if (status === 404) {
      expect(notifications.current()).toBeNull();
    } else {
      expect(notifications.current()?.status).toBe(status);
    }
    controller.verify();
  });

  it('clears a previous error when the same request returns a status handled locally', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    const notifications = TestBed.inject(ErrorNotificationService);
    const options = { context: new HttpContext().set(SKIP_ERROR_NOTIFICATION_STATUSES, [404]) };

    http.get('/api/example', options).subscribe({ error: () => undefined });
    controller.expectOne('/api/example').flush(null, { status: 503, statusText: 'Unavailable' });
    expect(notifications.current()?.status).toBe(503);

    http.get('/api/example', options).subscribe({ error: () => undefined });
    controller.expectOne('/api/example').flush(null, { status: 404, statusText: 'Not Found' });
    expect(notifications.current()).toBeNull();
    controller.verify();
  });

  it('normalizes API failures and publishes a safe global message', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    const notifications = TestBed.inject(ErrorNotificationService);
    let received: unknown;

    http.get('/api/example').subscribe({ error: (error: unknown) => (received = error) });
    controller
      .expectOne('/api/example')
      .flush({ message: 'Internal database details' }, { status: 503, statusText: 'Unavailable' });

    expect(received).toBeInstanceOf(AppError);
    expect((received as AppError).code).toBe(APP_ERROR_CODES.server);
    expect(notifications.current()?.code).toBe(APP_ERROR_CODES.server);
    expect(notifications.current()?.userMessage).not.toContain('database');
  });

  it('clears an API error after the same request succeeds on retry', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    const notifications = TestBed.inject(ErrorNotificationService);

    http.get('/api/product-groups').subscribe({ error: () => undefined });
    controller
      .expectOne('/api/product-groups')
      .flush(null, { status: 503, statusText: 'Unavailable' });
    expect(notifications.current()).not.toBeNull();

    http.get('/api/product-groups').subscribe();
    controller.expectOne('/api/product-groups').flush([]);

    expect(notifications.current()).toBeNull();
  });

  it('keeps the current API error when an unrelated request succeeds', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    const notifications = TestBed.inject(ErrorNotificationService);

    http.get('/api/product-groups').subscribe({ error: () => undefined });
    controller
      .expectOne('/api/product-groups')
      .flush(null, { status: 503, statusText: 'Unavailable' });

    http.get('/api/products?search=gold').subscribe();
    controller.expectOne('/api/products?search=gold').flush([]);

    expect(notifications.current()?.code).toBe(APP_ERROR_CODES.server);
  });

  it('normalizes and rethrows but suppresses the notification when asked to stay silent', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    const notifications = TestBed.inject(ErrorNotificationService);
    let received: unknown;

    http
      .post(
        '/api/auth/login',
        {},
        { context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) },
      )
      .subscribe({ error: (error: unknown) => (received = error) });
    controller
      .expectOne('/api/auth/login')
      .flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(received).toBeInstanceOf(AppError);
    expect(notifications.current()).toBeNull();
  });
});
