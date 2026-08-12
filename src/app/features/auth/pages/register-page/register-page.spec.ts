import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { APP_ERROR_CODES, AppError } from '../../../../core/errors/app-error';
import { AuthenticationService } from '../../data-access/authentication.service';
import { AuthenticationSessionService } from '../../data-access/authentication-session.service';
import { type AuthResult } from '../../models/auth.models';
import { RegisterPage } from './register-page';

const authResult: AuthResult = {
  accessToken: 'token-1',
  accessTokenExpiresAt: '2026-01-01T00:00:00Z',
  user: { id: 'customer-1', email: 'new@shoppyshop.test', displayName: null, roles: [] },
};

describe('RegisterPage', () => {
  const authenticationService = { register: vi.fn() };
  const session = { start: vi.fn() };

  beforeEach(async () => {
    authenticationService.register.mockReset();
    authenticationService.register.mockReturnValue(of(authResult));
    session.start.mockReset();

    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        { provide: AuthenticationService, useValue: authenticationService },
        { provide: AuthenticationSessionService, useValue: session },
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  it('presents an accessible registration form', () => {
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Create your account');
    expect(element.querySelector('label[for="email"]')?.textContent).toContain('Email address');
    expect(element.querySelector('label[for="password"]')?.textContent).toContain('Password');
    expect(element.querySelector('button[type="submit"]')?.textContent).toContain('Create account');
  });

  it('does not submit an invalid form', () => {
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );
    fixture.detectChanges();

    expect(authenticationService.register).not.toHaveBeenCalled();
  });

  it('rejects a password that does not meet the API password policy', () => {
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({
      displayName: '',
      email: 'new@shoppyshop.test',
      password: 'lowercase',
    });
    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Password does not meet the requirements above.',
    );
    expect(authenticationService.register).not.toHaveBeenCalled();
  });

  it('registers with the entered details and starts the session', () => {
    const navigate = vi.mocked(TestBed.inject(Router).navigateByUrl);
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({
      displayName: 'New Customer',
      email: 'new@shoppyshop.test',
      password: 'ShoppyShop123!',
    });
    fixture.componentInstance.submit();

    expect(authenticationService.register).toHaveBeenCalledWith({
      email: 'new@shoppyshop.test',
      password: 'ShoppyShop123!',
      displayName: 'New Customer',
    });
    expect(session.start).toHaveBeenCalledWith(authResult);
    expect(navigate).toHaveBeenCalledWith('/products', { replaceUrl: true });
  });

  it('shows a registration error', () => {
    authenticationService.register.mockReturnValue(
      throwError(
        () => new AppError(APP_ERROR_CODES.badRequest, 'That email is already taken.', 409),
      ),
    );
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({
      displayName: '',
      email: 'new@shoppyshop.test',
      password: 'ShoppyShop123!',
    });
    fixture.componentInstance.submit();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('That email is already taken.');
  });

  it('links back to the sign-in page', () => {
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a[href="/login"]')).toBeTruthy();
  });
});
