import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  type AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, take } from 'rxjs';

import { errorMessage } from '../../../core/errors/app-error';
import { ThemeService } from '../../../core/theme/theme.service';
import { LanguageSelector } from '../../../shared/ui/language-selector/language-selector';
import { AuthenticationService } from '../data-access/authentication.service';
import { AuthenticationSessionService } from '../data-access/authentication-session.service';
import { type RegisterRequest } from '../models/auth.models';

interface RegisterForm {
  displayName: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-register-page',
  imports: [LanguageSelector, ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly authenticationService = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly session = inject(AuthenticationSessionService);
  readonly theme = inject(ThemeService);

  readonly form = new FormGroup<RegisterForm>({
    displayName: new FormControl('', { nonNullable: true }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, passwordPolicyValidator],
    }),
  });

  readonly isSubmitting = signal(false);
  readonly registrationError = signal<string | null>(null);

  submit(): void {
    this.registrationError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { displayName, email, password } = this.form.getRawValue();
    const request: RegisterRequest = { email, password, displayName: displayName || null };
    this.isSubmitting.set(true);
    this.authenticationService
      .register(request)
      .pipe(
        take(1),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.session.start(result);
          void this.router.navigateByUrl('/products', { replaceUrl: true });
        },
        error: (error: unknown) => this.registrationError.set(errorMessage(error)),
      });
  }
}

/** Mirrors the API's ASP.NET Identity password policy so failures surface before submission. */
function passwordPolicyValidator(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const errors: ValidationErrors = {};
  if (value.length < 10) errors['tooShort'] = true;
  if (!/[a-z]/.test(value)) errors['missingLowercase'] = true;
  if (!/[A-Z]/.test(value)) errors['missingUppercase'] = true;
  if (!/\d/.test(value)) errors['missingDigit'] = true;
  if (!/[^a-zA-Z0-9]/.test(value)) errors['missingSymbol'] = true;
  return Object.keys(errors).length > 0 ? errors : null;
}
