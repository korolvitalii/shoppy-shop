import { HttpErrorResponse, type HttpInterceptorFn, type HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthenticationService } from '../data-access/authentication.service';
import { AuthenticationSessionService } from '../data-access/authentication-session.service';

const AUTH_ENDPOINTS = ['/api/auth/refresh', '/api/auth/login', '/api/auth/register'];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(AuthenticationSessionService);
  const authService = inject(AuthenticationService);

  return next(withBearer(request, session.accessToken())).pipe(
    catchError((error: unknown) => {
      const isRefreshable =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !AUTH_ENDPOINTS.some((endpoint) => request.url.includes(endpoint));
      if (!isRefreshable) return throwError(() => error);

      return authService.refresh().pipe(
        switchMap((result) => {
          session.start(result);
          return next(withBearer(request, result.accessToken));
        }),
        catchError(() => {
          session.end();
          return throwError(() => error);
        }),
      );
    }),
  );
};

function withBearer(request: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
}
