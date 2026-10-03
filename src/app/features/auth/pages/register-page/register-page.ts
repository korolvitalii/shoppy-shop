import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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

import { errorMessage } from '../../../../core/errors/app-error';
import { LanguageSelector } from '../../../../core/locale/language-selector/language-selector';
import { ThemeService } from '../../../../core/theme/theme.service';
import { AuthenticationService } from '../../data-access/authentication.service';
import { AuthenticationSessionService } from '../../data-access/authentication-session.service';
import { meetsPasswordPolicy, passwordPolicyChecks } from '../../domain/password-policy';
import { type RegisterRequest } from '../../models/auth.models';

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
  readonly showPassword = signal(false);
  readonly passwordToggleLabel = computed(() =>
    this.showPassword()
      ? $localize`:@@hidePassword:Hide password`
      : $localize`:@@showPassword:Show password`,
  );
  readonly themeToggleLabel = computed(() =>
    this.theme.isDark()
      ? $localize`:@@switchToLightTheme:Switch to light theme`
      : $localize`:@@switchToDarkTheme:Switch to dark theme`,
  );

  private readonly passwordValue = toSignal(this.form.controls.password.valueChanges, {
    initialValue: this.form.controls.password.value,
  });

  /** The live checklist and passwordPolicyValidator read the same policy checks. */
  readonly passwordChecks = computed(() => passwordPolicyChecks(this.passwordValue()));

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

/** Surfaces the API's password policy before submission; an empty value is left to `required`. */
function passwordPolicyValidator(control: AbstractControl<string>): ValidationErrors | null {
  if (!control.value) return null;

  const checks = passwordPolicyChecks(control.value);
  return meetsPasswordPolicy(checks) ? null : { passwordPolicy: checks };
}
