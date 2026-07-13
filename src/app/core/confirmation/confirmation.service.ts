import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

export interface ConfirmationRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  readonly current = signal<ConfirmationRequest | null>(null);

  private readonly document = inject(DOCUMENT);
  private pendingResolution: ((confirmed: boolean) => void) | null = null;
  private returnFocus: HTMLElement | null = null;

  confirm(request: ConfirmationRequest): Promise<boolean> {
    if (this.pendingResolution) this.finish(false);

    this.returnFocus =
      this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
    this.current.set({ cancelLabel: $localize`:@@cancel:Cancel`, tone: 'default', ...request });
    return new Promise<boolean>((resolve) => (this.pendingResolution = resolve));
  }

  accept(): void {
    this.finish(true);
  }

  cancel(): void {
    this.finish(false);
  }

  private finish(confirmed: boolean): void {
    const resolve = this.pendingResolution;
    const returnFocus = this.returnFocus;
    this.pendingResolution = null;
    this.returnFocus = null;
    this.current.set(null);
    resolve?.(confirmed);
    queueMicrotask(() => returnFocus?.focus());
  }
}
