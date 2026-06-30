import { type ErrorHandler, inject, Injectable } from '@angular/core';

import { ErrorNotificationService } from './error-notification.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly notifications = inject(ErrorNotificationService);

  handleError(error: unknown): void {
    this.notifications.show(error);
    console.error('Unhandled application error', error);
  }
}
