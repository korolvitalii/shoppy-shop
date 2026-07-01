import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';

import { OrdersRepository } from '../../../checkout/data-access/orders.repository';
import { type Order } from '../../../checkout/models/checkout.models';

type HistoryStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-order-history-page',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './order-history-page.html',
  styleUrl: './order-history-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderHistoryPage {
  readonly orders = signal<readonly Order[]>([]);
  readonly status = signal<HistoryStatus>('loading');

  private readonly repository = inject(OrdersRepository);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.load();
  }

  load(): void {
    this.status.set('loading');
    this.repository
      .getOrders()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.status.set('success');
        },
        error: () => this.status.set('error'),
      });
  }
}
