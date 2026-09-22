import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  type ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of, take } from 'rxjs';

import { ProductGroupsRepository } from '../../../catalogue/public-api';
import { OrdersRepository } from '../../data-access/orders.repository';
import {
  deriveOrderProgress,
  matchesFilter,
  type OrderFilter,
  type OrderProgress,
} from '../../domain/order-progress';
import { type Order } from '../../models/order.models';

type HistoryStatus = 'loading' | 'success' | 'error';

interface HistoryEntry {
  readonly order: Order;
  readonly progress: OrderProgress;
}

interface HistorySummary {
  readonly orders: number;
  readonly spentThisYear: number;
  readonly inTransit: number;
  readonly returnsOpen: number;
}

const ORDERS_PER_PAGE = 5;

const SERVER_HISTORY_PAGE_SIZE = 50;

@Component({
  selector: 'app-order-history-page',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './order-history-page.html',
  styleUrl: './order-history-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderHistoryPage {
  readonly status = signal<HistoryStatus>('loading');
  readonly filter = signal<OrderFilter>('all');

  readonly entries = computed<readonly HistoryEntry[]>(() => {
    const now = this.now();
    return this.orders().map((order) => ({
      order,
      progress: deriveOrderProgress(order.createdAt, now),
    }));
  });

  readonly matching = computed(() =>
    this.entries().filter(({ progress }) => matchesFilter(progress, this.filter())),
  );

  readonly visible = computed(() => this.matching().slice(0, this.visibleCount()));

  readonly hasEarlier = computed(
    () => this.matching().length > this.visibleCount() || !this.historyExhausted(),
  );

  readonly canPage = computed(() => this.pagerShown());

  readonly summary = computed<HistorySummary>(() => {
    const entries = this.entries();
    const year = this.now().getUTCFullYear();
    return {
      orders: entries.length,
      spentThisYear: entries.reduce(
        (total, { order }) =>
          new Date(order.createdAt).getUTCFullYear() === year ? total + order.total : total,
        0,
      ),
      inTransit: entries.filter(({ progress }) => matchesFilter(progress, 'in-transit')).length,
      returnsOpen: entries.filter(({ progress }) => matchesFilter(progress, 'returns')).length,
    };
  });

  private readonly allFilter = viewChild<ElementRef<HTMLButtonElement>>('allFilter');
  private readonly orders = signal<readonly Order[]>([]);
  private readonly categories = signal<ReadonlyMap<string, string>>(new Map());
  private readonly visibleCount = signal(ORDERS_PER_PAGE);
  private readonly now = signal(new Date());
  private readonly historyExhausted = signal(false);
  private readonly pagerShown = signal(false);
  private loadingMore = false;
  private readonly repository = inject(OrdersRepository);
  private readonly groupsRepository = inject(ProductGroupsRepository);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.load();
    this.loadCategories();
  }

  load(): void {
    this.status.set('loading');
    this.now.set(new Date());
    this.historyExhausted.set(false);
    this.pagerShown.set(false);
    this.repository
      .getOrders()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.historyExhausted.set(orders.length < SERVER_HISTORY_PAGE_SIZE);
          this.status.set('success');
          this.refreshPagerShown();
        },
        error: () => this.status.set('error'),
      });
  }

  selectFilter(filter: OrderFilter): void {
    this.filter.set(filter);
    this.visibleCount.set(ORDERS_PER_PAGE);
    this.pagerShown.set(false);
    this.refreshPagerShown();
  }

  showAllOrders(): void {
    this.selectFilter('all');
    this.allFilter()?.nativeElement.focus();
  }

  showEarlier(): void {
    if (!this.hasEarlier()) return;

    if (this.matching().length > this.visibleCount()) {
      this.visibleCount.update((count) => count + ORDERS_PER_PAGE);
      return;
    }

    this.loadMore();
  }

  private loadMore(): void {
    if (this.loadingMore) return;

    const last = this.orders().at(-1);
    if (!last) return;

    this.loadingMore = true;
    this.repository
      .getOrders({ before: last.createdAt, beforeId: last.id })
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.loadingMore = false;
          this.orders.update((existing) => [...existing, ...page]);
          this.historyExhausted.set(page.length < SERVER_HISTORY_PAGE_SIZE);
          this.visibleCount.update((count) => count + ORDERS_PER_PAGE);
          this.refreshPagerShown();
        },
        error: () => (this.loadingMore = false),
      });
  }

  private refreshPagerShown(): void {
    if (this.matching().length > ORDERS_PER_PAGE || !this.historyExhausted()) {
      this.pagerShown.set(true);
    }
  }

  categoryOf(groupId: string): string {
    return this.categories().get(groupId) ?? '';
  }

  private loadCategories(): void {
    this.groupsRepository
      .getAll({ silent: true })
      .pipe(
        take(1),
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((groups) => {
        this.categories.set(new Map(groups.map((group) => [group.id, group.name])));
      });
  }
}
