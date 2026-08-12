import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, take } from 'rxjs';

import { errorMessage } from '../../../../core/errors/app-error';
import { LanguageSelector } from '../../../../core/locale/language-selector/language-selector';
import { ThemeService } from '../../../../core/theme/theme.service';
import { AuthenticationService } from '../../data-access/authentication.service';
import { AuthenticationSessionService } from '../../data-access/authentication-session.service';
import { type LoginRequest } from '../../models/auth.models';

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-login-page',
  imports: [LanguageSelector, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly authenticationService = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(AuthenticationSessionService);
  readonly theme = inject(ThemeService);

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

  submit(): void {
    this.authenticationError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const credentials: LoginRequest = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.authenticationService
      .login(credentials)
      .pipe(
        take(1),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.session.start(result);
          const requested = this.route.snapshot.queryParamMap.get('returnUrl');
          const target =
            requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/products';
          void this.router.navigateByUrl(target, { replaceUrl: true });
        },
        error: (error: unknown) => this.authenticationError.set(errorMessage(error)),
      });
  }
}
