import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { apiErrorInterceptor } from '../errors/api-error.interceptor';
import { AppError } from '../errors/app-error';
import { ErrorNotificationService } from '../errors/error-notification.service';
import { apiLocaleInterceptor } from './api-locale.interceptor';
import { LOCALIZED_CONTENT } from './locale-context';

const localized = { context: new HttpContext().set(LOCALIZED_CONTENT, true) };

describe('API locale and error boundary', () => {
  const configure = (locale: string) =>
    TestBed.configureTestingModule({
      providers: [
        { provide: LOCALE_ID, useValue: locale },
        provideHttpClient(withInterceptors([apiLocaleInterceptor, apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

  it('sends the selected locale on marked requests and normalizes a structured HTTP 400', () => {
    configure('pl');
    const failed = vi.fn();
    TestBed.inject(HttpClient)
      .get('/api/products', { params: { search: 'test' }, ...localized })
      .subscribe({ error: failed });
    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne('/api/products?search=test&locale=pl');
    request.flush(
      { code: 'catalogue.cursor_invalid', detail: 'Untranslated server text' },
      { status: 400, statusText: 'Bad Request' },
    );
    expect(failed).toHaveBeenCalledWith(expect.any(AppError));
    expect(failed.mock.calls[0][0].userMessage).toBe(
      'The product list has changed. Refresh the page and try again.',
    );
    expect(TestBed.inject(ErrorNotificationService).current()?.status).toBe(400);
    http.verify();
  });

  it('names the default language explicitly rather than relying on the API default', () => {
    configure('en-GB');
    TestBed.inject(HttpClient).get('/api/product-groups', localized).subscribe();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/product-groups?locale=en').flush([]);
    http.verify();
  });

  it('leaves unmarked requests alone, such as authentication and third-party resources', () => {
    configure('pl');
    const client = TestBed.inject(HttpClient),
      http = TestBed.inject(HttpTestingController);
    for (const url of ['https://cdn.example.test/image', '/api/auth/login', '/api/products']) {
      client.get(url).subscribe();
      http.expectOne(url).flush({});
    }
    http.verify();
  });
});
