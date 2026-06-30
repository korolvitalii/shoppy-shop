import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';

import { CheckoutFacade } from '../../data-access/checkout.facade';
@Component({
  selector: 'app-review-page',
  imports: [CurrencyPipe],
  templateUrl: './review-page.html',
  styleUrl: '../checkout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewPage {
  protected readonly facade = inject(CheckoutFacade);
  private readonly router = inject(Router);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  submit() {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.facade
      .createOrder()
      .pipe(
        take(1),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: (order) => {
          this.facade.clearBasket();
          void this.router.navigateByUrl(`/orders/${order.id}/confirmation`, { replaceUrl: true });
        },
        error: () => this.error.set('We could not place your order. Please try again.'),
      });
  }
}
