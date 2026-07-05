import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { apiErrorInterceptor } from './api-error.interceptor';
import { APP_ERROR_CODES, AppError } from './app-error';
import { ErrorNotificationService } from './error-notification.service';

describe('apiErrorInterceptor', () => {
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
});
