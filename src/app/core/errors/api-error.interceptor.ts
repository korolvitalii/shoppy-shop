import { HttpEventType, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';

import { normalizeError } from './app-error';
import { SKIP_ERROR_NOTIFICATION } from './error-context';
import { ErrorNotificationService } from './error-notification.service';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const notifications = inject(ErrorNotificationService);
  const requestSource = `${request.method} ${request.urlWithParams}`;

  return next(request).pipe(
    tap((event) => {
      if (event.type === HttpEventType.Response) notifications.dismiss(requestSource);
    }),
    catchError((error: unknown) => {
      const normalized = normalizeError(error);
      if (!request.context.get(SKIP_ERROR_NOTIFICATION)) {
        notifications.show(normalized, requestSource);
      }
      return throwError(() => normalized);
    }),
  );
};
