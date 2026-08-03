import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthenticationService } from './authentication.service';

describe('AuthenticationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('shares a single in-flight refresh request between concurrent callers', () => {
    const service = TestBed.inject(AuthenticationService);
    const http = TestBed.inject(HttpTestingController);
    let firstResult: unknown;
    let secondResult: unknown;

    service.refresh().subscribe((result) => (firstResult = result));
    service.refresh().subscribe((result) => (secondResult = result));

    const request = http.expectOne('/api/auth/refresh');
    request.flush({
      accessToken: 'token-1',
      accessTokenExpiresAt: '2026-01-01T00:00:00Z',
      user: {},
    });

    expect(firstResult).toEqual(secondResult);
  });

  it('issues a fresh request for a refresh call made after the previous one settles', () => {
    const service = TestBed.inject(AuthenticationService);
    const http = TestBed.inject(HttpTestingController);

    service.refresh().subscribe();
    http
      .expectOne('/api/auth/refresh')
      .flush({ accessToken: 'token-1', accessTokenExpiresAt: '2026-01-01T00:00:00Z', user: {} });

    service.refresh().subscribe();
    http
      .expectOne('/api/auth/refresh')
      .flush({ accessToken: 'token-2', accessTokenExpiresAt: '2026-01-01T00:05:00Z', user: {} });
  });
});
