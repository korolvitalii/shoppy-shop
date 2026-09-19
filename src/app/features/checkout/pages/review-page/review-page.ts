import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize, take } from 'rxjs';

import { CheckoutStepper } from '../../components/checkout-stepper/checkout-stepper';
import { CheckoutSummaryBar } from '../../components/checkout-summary-bar/checkout-summary-bar';
import { CheckoutTotals } from '../../components/checkout-totals/checkout-totals';
import { CheckoutFacade } from '../../data-access/checkout.facade';
@Component({
  selector: 'app-review-page',
  imports: [CheckoutStepper, CheckoutSummaryBar, CheckoutTotals, CurrencyPipe, RouterLink],
  templateUrl: './review-page.html',
  styleUrls: ['../checkout.scss', './review-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewPage {
  protected readonly facade = inject(CheckoutFacade);
  private readonly router = inject(Router);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    if (this.submitting()) return;
    this.error.set(null);
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
        error: () =>
          this.error.set(
            $localize`:@@placeOrderError:We could not place your order. Please try again.`,
          ),
      });
  }
}
