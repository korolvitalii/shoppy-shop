import { Injectable, signal } from '@angular/core';

const DISPLAY_DELAY_MS = 200;

@Injectable({ providedIn: 'root' })
export class LoadingService {
  readonly isLoading = signal(false);

  private activeOperations = 0;
  private displayTimer: ReturnType<typeof setTimeout> | null = null;

  start(): void {
    this.activeOperations += 1;
    if (this.activeOperations > 1 || this.isLoading()) return;

    this.displayTimer = setTimeout(() => {
      this.displayTimer = null;
      if (this.activeOperations > 0) this.isLoading.set(true);
    }, DISPLAY_DELAY_MS);
  }

  stop(): void {
    this.activeOperations = Math.max(0, this.activeOperations - 1);
    if (this.activeOperations > 0) return;

    if (this.displayTimer) {
      clearTimeout(this.displayTimer);
      this.displayTimer = null;
    }
    this.isLoading.set(false);
  }
}
