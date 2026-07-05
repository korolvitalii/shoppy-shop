import { Injectable, signal } from '@angular/core';

import { type AppError, normalizeError } from './app-error';

@Injectable({ providedIn: 'root' })
export class ErrorNotificationService {
  readonly current = signal<AppError | null>(null);
  private currentSource: string | null = null;

  show(error: unknown, source: string | null = null): AppError {
    const normalized = normalizeError(error);
    this.currentSource = source;
    this.current.set(normalized);
    return normalized;
  }

  dismiss(source?: string): void {
    if (source !== undefined && source !== this.currentSource) return;

    this.currentSource = null;
    this.current.set(null);
  }
}
