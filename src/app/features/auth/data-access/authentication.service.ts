import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { defer, finalize, firstValueFrom, type Observable, shareReplay } from 'rxjs';

import { SKIP_ERROR_NOTIFICATION } from '../../../core/errors/error-context';
import {
  type AuthResult,
  type LoginRequest,
  type RegisterRequest,
  type UserDto,
} from '../models/auth.models';

const REFRESH_LOCK = 'shoppy-shop.auth-refresh';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
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
   * Refresh tokens rotate server-side on every use, and the API treats a second use of a rotated
   * token as theft: it ends every session the user has. Two guards stop the storefront from
   * tripping that on its own:
   *
   * - Concurrent callers in this tab (app-boot restore and the auth interceptor's 401 handling)
   *   share a single in-flight request.
   * - Tabs take turns through a Web Lock. Every tab shares one cookie jar, so a tab that waited
   *   sends its request after the previous tab's response has replaced the cookie, and presents
   *   the new token instead of the one that was just rotated out.
   */
  refresh(): Observable<AuthResult> {
    this.refreshInFlight ??= underRefreshLock(
      this.document.defaultView?.navigator.locks,
      this.http.post<AuthResult>('/api/auth/refresh', {}, { context: silentContext() }),
    ).pipe(
      finalize(() => (this.refreshInFlight = null)),
      shareReplay(1),
    );
    return this.refreshInFlight;
  }
}

function silentContext(): HttpContext {
  return new HttpContext().set(SKIP_ERROR_NOTIFICATION, true);
}

/**
 * Sends `request` while this tab holds the cross-tab refresh lock. The lock is released only when
 * the response has arrived, and the browser stores a `Set-Cookie` before the response reaches
 * script, so the next tab's request carries the rotated cookie. A browser without Web Locks sends
 * the request unguarded, which is how every browser behaved before this lock existed.
 */
function underRefreshLock<T>(
  locks: LockManager | undefined,
  request: Observable<T>,
): Observable<T> {
  if (!locks) return request;
  return defer(() => locks.request(REFRESH_LOCK, () => firstValueFrom(request)));
}
