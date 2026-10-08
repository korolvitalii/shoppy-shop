import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

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

  describe('across tabs', () => {
    let locks: FakeLockManager;

    beforeEach(() => {
      locks = new FakeLockManager();
      Object.defineProperty(navigatorOf(TestBed.inject(DOCUMENT)), 'locks', {
        configurable: true,
        value: locks,
      });
    });

    afterEach(() => {
      Reflect.deleteProperty(navigatorOf(TestBed.inject(DOCUMENT)), 'locks');
      TestBed.inject(HttpTestingController).verify();
    });

    it('presents the refresh cookie only once another tab has released the lock', async () => {
      const service = TestBed.inject(AuthenticationService);
      const http = TestBed.inject(HttpTestingController);
      const releaseOtherTab = locks.holdForAnotherTab();

      const result = firstValueFrom(service.refresh());
      await settle();
      http.expectNone('/api/auth/refresh');

      releaseOtherTab();
      await settle();
      http.expectOne('/api/auth/refresh').flush(authResult('token-1'));

      expect((await result).accessToken).toBe('token-1');
    });

    it('makes a second tab wait until the first tab has its response', async () => {
      const firstTab = TestBed.inject(AuthenticationService);
      const secondTab = TestBed.runInInjectionContext(() => new AuthenticationService());
      const http = TestBed.inject(HttpTestingController);

      const first = firstValueFrom(firstTab.refresh());
      const second = firstValueFrom(secondTab.refresh());
      await settle();

      // expectOne fails if both tabs' requests are outstanding at once.
      http.expectOne('/api/auth/refresh').flush(authResult('token-1'));
      await settle();
      http.expectOne('/api/auth/refresh').flush(authResult('token-2'));

      expect((await first).accessToken).toBe('token-1');
      expect((await second).accessToken).toBe('token-2');
    });

    it('releases the lock when the refresh fails', async () => {
      const service = TestBed.inject(AuthenticationService);
      const http = TestBed.inject(HttpTestingController);

      const failed = firstValueFrom(service.refresh());
      await settle();
      expect(locks.held).toBe(true);
      http.expectOne('/api/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });

      await expect(failed).rejects.toBeInstanceOf(HttpErrorResponse);
      expect(locks.held).toBe(false);
    });
  });
});

/** An in-memory stand-in for the browser's LockManager: one holder at a time, waiters in order. */
class FakeLockManager {
  held = false;
  private tail: Promise<unknown> = Promise.resolve();

  request<T>(_name: string, callback: () => Promise<T>): Promise<T> {
    const granted = this.tail.then(async () => {
      this.held = true;
      try {
        return await callback();
      } finally {
        this.held = false;
      }
    });
    this.tail = granted.catch(() => undefined);
    return granted;
  }

  holdForAnotherTab(): () => void {
    let release = (): void => undefined;
    void this.request('another-tab', () => new Promise<void>((resolve) => (release = resolve)));
    return () => release();
  }
}

function navigatorOf(document: Document): Navigator {
  const view = document.defaultView;
  if (!view) throw new Error('The test document has no window.');
  return view.navigator;
}

function authResult(accessToken: string): Record<string, unknown> {
  return { accessToken, accessTokenExpiresAt: '2026-01-01T00:00:00Z', user: {} };
}

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}
