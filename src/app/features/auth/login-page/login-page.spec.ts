import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { APP_ERROR_CODES, AppError } from '../../../core/errors/app-error';
import { AuthenticationService } from '../data-access/authentication.service';
import { AuthenticationSessionService } from '../data-access/authentication-session.service';
import { type AuthResult } from '../models/auth.models';
import { LoginPage } from './login-page';

const authResult: AuthResult = {
  accessToken: 'token-1',
  accessTokenExpiresAt: '2026-01-01T00:00:00Z',
  user: { id: 'customer-1', email: 'demo@shoppyshop.test', displayName: null, roles: [] },
};

describe('LoginPage', () => {
  const authenticationService = { login: vi.fn() };
  const session = { start: vi.fn() };

  beforeEach(async () => {
    authenticationService.login.mockReset();
    authenticationService.login.mockReturnValue(of(authResult));
    session.start.mockReset();

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthenticationService, useValue: authenticationService },
        { provide: AuthenticationSessionService, useValue: session },
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  it('presents an accessible sign-in form', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[aria-label="ShoppyShop"]')).toBeTruthy();
    expect(element.querySelector('h1')?.textContent).toContain('Welcome back');
    expect(element.querySelector('label[for="email"]')?.textContent).toContain('Email address');
    expect(element.querySelector('label[for="password"]')?.textContent).toContain('Password');
    expect(element.querySelector('button[type="submit"]')?.textContent).toContain('Sign in');
  });

  it('shows validation errors and does not submit an empty form', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Email is required');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Password is required');
    expect(fixture.nativeElement.querySelector('#email').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#password').getAttribute('aria-invalid')).toBe(
      'true',
    );
    expect(authenticationService.login).not.toHaveBeenCalled();
  });

  it('rejects an invalid email address', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({ email: 'not-an-email', password: 'password123' });
    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Enter a valid email address',
    );
    expect(authenticationService.login).not.toHaveBeenCalled();
  });

  it('links to the registration page', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a[href="/register"]')).toBeTruthy();
  });

  it('submits valid credentials through the authentication service', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const credentials = { email: 'demo@shoppyshop.test', password: 'ShoppyShop123!' };

    fixture.componentInstance.form.setValue(credentials);
    fixture.componentInstance.submit();

    expect(authenticationService.login).toHaveBeenCalledWith(credentials);
  });

  it('starts the session and redirects to the catalogue after successful authentication', () => {
    const navigate = vi.mocked(TestBed.inject(Router).navigateByUrl);
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      email: 'demo@shoppyshop.test',
      password: 'ShoppyShop123!',
    });

    fixture.componentInstance.submit();

    expect(session.start).toHaveBeenCalledWith(authResult);
    expect(navigate).toHaveBeenCalledWith('/products', { replaceUrl: true });
  });

  it('announces rejected credentials as an alert', () => {
    const navigate = vi.mocked(TestBed.inject(Router).navigateByUrl);
    authenticationService.login.mockReturnValue(
      throwError(
        () => new AppError(APP_ERROR_CODES.unauthorized, 'Invalid email or password.', 401),
      ),
    );
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      email: 'customer@example.com',
      password: 'incorrect-password',
    });

    fixture.componentInstance.submit();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('Invalid email or password.');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('prevents duplicate submissions while authentication is pending', () => {
    const result = new Subject<AuthResult>();
    authenticationService.login.mockReturnValue(result);
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      email: 'demo@shoppyshop.test',
      password: 'ShoppyShop123!',
    });

    fixture.componentInstance.submit();
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
    expect(submitButton.textContent).toContain('Signing in');

    result.next(authResult);
    result.complete();
    fixture.detectChanges();

    expect(submitButton.disabled).toBe(false);
  });
});
