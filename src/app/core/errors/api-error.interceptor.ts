import { type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { normalizeError } from './app-error';
import { ErrorNotificationService } from './error-notification.service';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const notifications = inject(ErrorNotificationService);

  return next(request).pipe(
    catchError((error: unknown) => {
      const normalized = normalizeError(error);
      notifications.show(normalized);
      return throwError(() => normalized);
    }),
  );
};
