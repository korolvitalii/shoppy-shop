import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { anonymousGuard, authenticationGuard } from '../guards/authentication.guard';
import { type AuthResult } from '../models/auth.models';
import { AuthenticationSessionService } from './authentication-session.service';

const authResult = (overrides: Partial<AuthResult['user']> = {}): AuthResult => ({
  accessToken: 'token-1',
  accessTokenExpiresAt: '2026-01-01T00:00:00Z',
  user: {
    id: 'customer-1',
    email: 'demo@shoppyshop.test',
    displayName: null,
    roles: [],
    ...overrides,
  },
});

describe('AuthenticationSessionService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });
  it('holds the authenticated user and access token in memory', () => {
    const service = TestBed.inject(AuthenticationSessionService);
    service.start(authResult());
    expect(service.isAuthenticated()).toBe(true);
    expect(service.accessToken()).toBe('token-1');
  });
  it('clears the session on logout', () => {
    const service = TestBed.inject(AuthenticationSessionService);
    service.start(authResult());
    service.end();
    expect(service.user()).toBeNull();
    expect(service.accessToken()).toBeNull();
  });
});

describe('authenticationGuard', () => {
  it('returns a login UrlTree with the requested internal URL', () => {
    const parseUrl = vi.fn(() => 'tree');
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { parseUrl } },
        { provide: AuthenticationSessionService, useValue: { isAuthenticated: () => false } },
      ],
    });
    expect(
      TestBed.runInInjectionContext(() =>
        authenticationGuard({} as never, { url: '/checkout/review' } as never),
      ),
    ).toBe('tree');
    expect(parseUrl).toHaveBeenCalledWith('/login?returnUrl=%2Fcheckout%2Freview');
  });

  it('allows authenticated customers to open protected pages', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthenticationSessionService, useValue: { isAuthenticated: () => true } },
      ],
    });

    expect(
      TestBed.runInInjectionContext(() =>
        authenticationGuard({} as never, { url: '/orders' } as never),
      ),
    ).toBe(true);
  });
});

describe('anonymousGuard', () => {
  it('redirects authenticated customers away from the login page', () => {
    const parseUrl = vi.fn(() => 'products-tree');
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { parseUrl } },
        { provide: AuthenticationSessionService, useValue: { isAuthenticated: () => true } },
      ],
    });

    expect(TestBed.runInInjectionContext(() => anonymousGuard({} as never, {} as never))).toBe(
      'products-tree',
    );
    expect(parseUrl).toHaveBeenCalledWith('/products');
  });
});
