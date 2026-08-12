import {
  ChangeDetectionStrategy,
  Component,
  effect,
  type ElementRef,
  inject,
  viewChild,
  viewChildren,
} from '@angular/core';

import { ConfirmationService } from '../../../core/confirmation/confirmation.service';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialog {
  protected readonly confirmation = inject(ConfirmationService);
  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');
  private readonly dialogButtons = viewChildren<ElementRef<HTMLButtonElement>>('dialogButton');

  constructor() {
    effect(() => this.confirmButton()?.nativeElement.focus());
  }

  protected handleBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.confirmation.cancel();
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.confirmation.cancel();
      return;
    }
    if (event.key !== 'Tab') return;

    const buttons = this.dialogButtons().map(({ nativeElement }) => nativeElement);
    const currentIndex = buttons.indexOf(event.target as HTMLButtonElement);
    const nextIndex = event.shiftKey
      ? currentIndex <= 0
        ? buttons.length - 1
        : currentIndex - 1
      : currentIndex >= buttons.length - 1
        ? 0
        : currentIndex + 1;
    event.preventDefault();
    buttons[nextIndex]?.focus();
  }
}
