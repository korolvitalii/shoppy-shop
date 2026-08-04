import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthenticationService } from '../../features/auth/data-access/authentication.service';
import { AuthenticationSessionService } from '../../features/auth/data-access/authentication-session.service';
import { type AuthResult } from '../../features/auth/models/auth.models';
import { authInterceptor } from './auth.interceptor';

const authResult: AuthResult = {
  accessToken: 'fresh-token',
  accessTokenExpiresAt: '2026-01-01T00:00:00Z',
  user: { id: 'customer-1', email: 'demo@shoppyshop.test', displayName: null, roles: [] },
};

describe('authInterceptor', () => {
  const session = { accessToken: vi.fn(), start: vi.fn(), end: vi.fn() };
  const authenticationService = { refresh: vi.fn() };

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthenticationSessionService, useValue: session },
        { provide: AuthenticationService, useValue: authenticationService },
      ],
    });
    return {
      http: TestBed.inject(HttpClient),
      controller: TestBed.inject(HttpTestingController),
    };
  };

  beforeEach(() => {
    session.accessToken.mockReset().mockReturnValue('current-token');
    session.start.mockReset();
    session.end.mockReset();
    authenticationService.refresh.mockReset();
  });

  it('attaches the current access token as a bearer header', () => {
    const { http, controller } = setup();

    http.get('/api/orders').subscribe();

    const request = controller.expectOne('/api/orders');
    expect(request.request.headers.get('Authorization')).toBe('Bearer current-token');
    request.flush([]);
  });

  it('refreshes and retries once on a 401, then starts the new session', () => {
    authenticationService.refresh.mockReturnValue(of(authResult));
    const { http, controller } = setup();
    let result: unknown;

    http.get('/api/orders').subscribe((response) => (result = response));

    controller.expectOne('/api/orders').flush(null, { status: 401, statusText: 'Unauthorized' });
    const retry = controller.expectOne('/api/orders');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer fresh-token');
    retry.flush([{ id: 'ORD-1' }]);

    expect(session.start).toHaveBeenCalledWith(authResult);
    expect(result).toEqual([{ id: 'ORD-1' }]);
  });

  it('ends the session and surfaces the original error when refresh fails', () => {
    authenticationService.refresh.mockReturnValue(throwError(() => new Error('refresh failed')));
    const { http, controller } = setup();
    let error: unknown;

    http.get('/api/orders').subscribe({ error: (err: unknown) => (error = err) });

    controller.expectOne('/api/orders').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(session.end).toHaveBeenCalled();
    expect((error as { status: number }).status).toBe(401);
  });

  it('does not attempt a refresh for the refresh endpoint itself', () => {
    const { http, controller } = setup();
    let error: unknown;

    http.post('/api/auth/refresh', {}).subscribe({ error: (err: unknown) => (error = err) });

    controller
      .expectOne('/api/auth/refresh')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authenticationService.refresh).not.toHaveBeenCalled();
    expect(error).toBeTruthy();
  });
});
