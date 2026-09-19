import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';

import { OrdersRepository } from '../../data-access/orders.repository';
import { estimateArrivalWindow } from '../../domain/delivery-estimate';
import { type Order } from '../../models/order.models';

@Component({
  selector: 'app-order-confirmation-page',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './order-confirmation-page.html',
  styleUrl: './order-confirmation-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderConfirmationPage {
  private readonly repository = inject(OrdersRepository);
  readonly order = signal<Order | null>(null);
  readonly error = signal(false);
  readonly estimatedArrival = computed(() => estimateArrivalWindow(this.order()?.createdAt));
  readonly announcement = computed(() => {
    const value = this.order();
    if (value)
      return $localize`:@@orderConfirmedAnnouncement:Order ${value.id}:orderId: confirmed.`;
    if (this.error()) return $localize`:@@orderUnavailable:Order unavailable`;
    return $localize`:@@loadingOrder:Loading order…`;
  });

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
        takeUntilDestroyed(),
      )
      .subscribe((value) => {
        this.order.set(value);
        if (!value) this.error.set(true);
      });
  }
}
