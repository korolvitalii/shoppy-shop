import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { catchError, of } from 'rxjs';

import { type Product } from '../../../shared/domain/product';
import { AuthenticationSessionService } from '../../auth/public-api';
import { FavoritesApiClient } from './favorites-api.client';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly api = inject(FavoritesApiClient);
  private readonly session = inject(AuthenticationSessionService);
  private readonly productsState = signal<readonly Product[]>([]);

  readonly products = this.productsState.asReadonly();
  readonly count = computed(() => this.productsState().length);
  readonly productIds = computed(() => new Set(this.productsState().map((product) => product.id)));

  constructor() {
    effect(() => {
      if (this.session.isAuthenticated()) {
        this.load();
      } else {
        this.productsState.set([]);
      }
    });
  }

  has(productId: string): boolean {
    return this.productIds().has(productId);
  }

  toggle(product: Product): void {
    if (this.has(product.id)) {
      this.remove(product.id);
      return;
    }

    this.productsState.set([...this.productsState(), product]);
    this.api
      .add(product.id)
      .pipe(catchError(() => this.revertTo(this.without(product.id))))
      .subscribe();
  }

  remove(productId: string): void {
    const previous = this.productsState();
    this.productsState.set(this.without(productId));
    this.api
      .remove(productId)
      .pipe(catchError(() => this.revertTo(previous)))
      .subscribe();
  }

  clear(): void {
    const previous = this.productsState();
    this.productsState.set([]);
    this.api
      .clear()
      .pipe(catchError(() => this.revertTo(previous)))
      .subscribe();
  }

  private load(): void {
    this.api
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe((products) => this.productsState.set(products));
  }

  private without(productId: string): readonly Product[] {
    return this.productsState().filter((product) => product.id !== productId);
  }

  /**
   * Reverts the optimistic update on failure. The api-error interceptor already normalizes and
   * surfaces a toast for the underlying HTTP error, so this swallows it rather than rethrowing to
   * an unhandled subscription.
   */
  private revertTo(previous: readonly Product[]) {
    this.productsState.set(previous);
    return of(undefined);
  }
}
