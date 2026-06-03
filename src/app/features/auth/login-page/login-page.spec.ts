import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthenticationService } from '../data-access/authentication.service';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  const authenticationService = { login: vi.fn() };

  beforeEach(async () => {
    authenticationService.login.mockReset();
    authenticationService.login.mockReturnValue(
      of({ success: true, user: { id: 'customer-1', email: 'demo@shoppyshop.test' } }),
    );

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthenticationService, useValue: authenticationService },
      ],
    }).compileComponents();
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

  it('fills the form when a demo account is selected', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[data-testid="demo-account"]') as HTMLButtonElement).click();

    expect(fixture.componentInstance.form.getRawValue()).toEqual({
      email: 'demo@shoppyshop.test',
      password: 'ShoppyShop123!',
    });
  });

  it('submits valid credentials through the authentication service', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const credentials = { email: 'demo@shoppyshop.test', password: 'ShoppyShop123!' };

    fixture.componentInstance.form.setValue(credentials);
    fixture.componentInstance.submit();

    expect(authenticationService.login).toHaveBeenCalledWith(credentials);
  });
});
