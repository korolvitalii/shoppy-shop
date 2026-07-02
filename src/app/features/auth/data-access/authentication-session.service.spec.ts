import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { anonymousGuard, authenticationGuard } from '../guards/authentication.guard';
import { AuthenticationSessionService } from './authentication-session.service';

describe('AuthenticationSessionService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
  });
  it('persists and restores only the mock user session', () => {
    const service = TestBed.inject(AuthenticationSessionService);
    service.start({ id: 'customer-1', email: 'demo@shoppyshop.test' });
    expect(service.isAuthenticated()).toBe(true);
    expect(sessionStorage.getItem('shoppyshop.session.v1')).not.toContain('password');
  });
  it('clears the session on logout', () => {
    const service = TestBed.inject(AuthenticationSessionService);
    service.start({ id: '1', email: 'a@b.com' });
    service.end();
    expect(service.user()).toBeNull();
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

    expect(TestBed.runInInjectionContext(() => anonymousGuard())).toBe('products-tree');
    expect(parseUrl).toHaveBeenCalledWith('/products');
  });
});
