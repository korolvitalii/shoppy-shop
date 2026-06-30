import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';

import { OrdersRepository } from '../../data-access/orders.repository';
import { type Order } from '../../models/checkout.models';
@Component({
  selector: 'app-order-confirmation-page',
  imports: [RouterLink],
  template: `<main class="checkout">
    @if (order(); as value) {
      <p class="step">Order confirmed</p>
      <h1>Thank you</h1>
      <p>
        Your order <strong>{{ value.id }}</strong> is confirmed.
      </p>
      <a routerLink="/products">Continue shopping</a>
    } @else if (error()) {
      <h1>Order unavailable</h1>
      <a routerLink="/products">Browse products</a>
    } @else {
      <p role="status">Loading order…</p>
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
