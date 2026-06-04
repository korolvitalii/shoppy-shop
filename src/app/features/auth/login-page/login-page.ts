import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, take } from 'rxjs';

import {
  AuthenticationService,
  LoginCredentials,
} from '../data-access/authentication.service';

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

const DEMO_CREDENTIALS: LoginCredentials = {
  email: 'demo@shoppyshop.test',
  password: 'ShoppyShop123!',
};

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly authenticationService = inject(AuthenticationService);

  readonly form = new FormGroup<LoginForm>({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly isSubmitting = signal(false);
  readonly authenticationError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  useDemoAccount(): void {
    this.form.setValue(DEMO_CREDENTIALS);
    this.form.markAsPristine();
    this.authenticationError.set(null);
  }

  submit(): void {
    this.authenticationError.set(null);
    this.successMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.authenticationService
      .login(this.form.getRawValue())
      .pipe(
        take(1),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe((result) => {
        if (result.success) {
          this.successMessage.set(`Welcome, ${result.user.email}.`);
          return;
        }

        this.authenticationError.set(result.error);
      });
  }
}
