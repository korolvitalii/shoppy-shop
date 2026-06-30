import { Injectable, signal } from '@angular/core';

import { type AppError, normalizeError } from './app-error';

@Injectable({ providedIn: 'root' })
export class ErrorNotificationService {
  readonly current = signal<AppError | null>(null);

  show(error: unknown): AppError {
    const normalized = normalizeError(error);
    this.current.set(normalized);
    return normalized;
  }

  dismiss(): void {
    this.current.set(null);
  }
}
