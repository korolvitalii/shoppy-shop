import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SKIP_ERROR_NOTIFICATION } from '../errors/error-context';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('defaults to the assistant being enabled before load resolves', () => {
    const service = TestBed.inject(ConfigService);

    expect(service.assistantEnabled()).toBe(true);
  });

  it('fetches the feature config silently and updates the signal from the response', () => {
    const service = TestBed.inject(ConfigService);
    const http = TestBed.inject(HttpTestingController);

    service.load().subscribe();

    const request = http.expectOne('/api/feature-config');
    expect(request.request.method).toBe('GET');
    expect(request.request.context.get(SKIP_ERROR_NOTIFICATION)).toBe(true);
    request.flush({ assistantEnabled: false });

    expect(service.assistantEnabled()).toBe(false);
  });

  it('fails open and keeps the default when the request errors', () => {
    const service = TestBed.inject(ConfigService);
    const http = TestBed.inject(HttpTestingController);
    let completed = false;

    service.load().subscribe({ complete: () => (completed = true) });
    http
      .expectOne('/api/feature-config')
      .flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(completed).toBe(true);
    expect(service.assistantEnabled()).toBe(true);
  });
});
