import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';

import { OrdersRepository } from '../../data-access/orders.repository';
import { type Order } from '../../models/checkout.models';
@Component({
  selector: 'app-order-confirmation-page',
  imports: [CurrencyPipe, RouterLink],
  template: `<main class="checkout">
    @if (order(); as value) {
      <section class="confirmation" role="status" aria-live="polite">
        <span class="confirmation-icon" aria-hidden="true">✓</span>
        <p class="step" i18n="@@orderConfirmed">Order confirmed</p>
        <h1 i18n="@@thankYouOrder">Thank you for your order</h1>
        <p i18n="@@orderConfirmationDetail">
          Your new order <strong>{{ value.id }}</strong> has been placed successfully. We sent the
          confirmation to {{ value.delivery.email }}.
        </p>
        <p class="confirmation-total">
          <span i18n="@@totalPaid">Total paid</span>
          <strong>{{ value.total | currency: 'GBP' }}</strong>
        </p>
        <div class="checkout-actions">
          <a class="secondary-action" routerLink="/orders" i18n="@@viewPurchaseHistory"
            >View purchase history</a
          >
          <a class="primary-action" routerLink="/products" i18n="@@continueShopping"
            >Continue shopping</a
          >
        </div>
      </section>
    } @else if (error()) {
      <h1 i18n="@@orderUnavailable">Order unavailable</h1>
      <p i18n="@@orderUnavailableDetail">
        We could not load this confirmation. Your purchase history may still contain the order.
      </p>
      <a routerLink="/orders" i18n="@@viewPurchaseHistory">View purchase history</a>
      <a routerLink="/products" i18n="@@browseProducts">Browse products</a>
    } @else {
      <p role="status" i18n="@@loadingOrder">Loading order…</p>
    }
  </main>`,
  styleUrl: '../checkout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderConfirmationPage {
  private readonly repository = inject(OrdersRepository);
  readonly order = signal<Order | null>(null);
  readonly error = signal(false);

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(
        switchMap((p) =>
          this.repository.getOrderById(p.get('orderId') ?? '').pipe(
            catchError(() => {
              this.error.set(true);
              return of(null);
            }),
          ),
        ),
      )
      .subscribe((value) => {
        this.order.set(value);
        if (!value) this.error.set(true);
      });
  }
}
