import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { finalize, type Observable, shareReplay } from 'rxjs';

import { SKIP_ERROR_NOTIFICATION } from '../../../core/errors/error-context';
import {
  type AuthResult,
  type LoginRequest,
  type RegisterRequest,
  type UserDto,
} from '../models/auth.models';

const silentContext = () => new HttpContext().set(SKIP_ERROR_NOTIFICATION, true);

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly http = inject(HttpClient);
  private refreshInFlight: Observable<AuthResult> | null = null;

  login(credentials: LoginRequest): Observable<AuthResult> {
    return this.http.post<AuthResult>('/api/auth/login', credentials, {
      context: silentContext(),
    });
  }

  register(request: RegisterRequest): Observable<AuthResult> {
    return this.http.post<AuthResult>('/api/auth/register', request, {
      context: silentContext(),
    });
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {});
  }

  me(): Observable<UserDto | null> {
    return this.http.get<UserDto | null>('/api/auth/me');
  }

  /**
   * Refresh tokens rotate server-side on every use, so concurrent callers (app-boot restore and
   * the auth interceptor's 401 handling) must share a single in-flight request rather than each
   * presenting the same refresh cookie, which would trip reuse detection.
   */
  refresh(): Observable<AuthResult> {
    this.refreshInFlight ??= this.http
      .post<AuthResult>('/api/auth/refresh', {}, { context: silentContext() })
      .pipe(
        finalize(() => (this.refreshInFlight = null)),
        shareReplay(1),
      );
    return this.refreshInFlight;
  }
}
