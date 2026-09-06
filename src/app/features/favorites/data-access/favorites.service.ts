import { computed, DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { catchError, concatMap, EMPTY, type Observable, Subject, Subscription, tap } from 'rxjs';

import { type Product } from '../../../shared/domain/product';
import { AuthenticationSessionService } from '../../auth/public-api';
import { FavoritesApiClient } from './favorites-api.client';

type Mutation =
  { kind: 'add'; product: Product } | { kind: 'remove'; productId: string } | { kind: 'clear' };

interface FavoritesSession {
  userId: string;
  confirmed: readonly Product[];
  pending: Mutation[];
  requests: Subject<Mutation | null>;
  subscription: Subscription;
}

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly api = inject(FavoritesApiClient);
  private readonly session = inject(AuthenticationSessionService);
  private readonly productsState = signal<readonly Product[]>([]);
  private readonly userId = computed(() => this.session.user()?.id ?? null);
  private activeSession: FavoritesSession | null = null;

  readonly products = this.productsState.asReadonly();
  readonly count = computed(() => this.productsState().length);
  readonly productIds = computed(() => new Set(this.productsState().map((product) => product.id)));

  constructor() {
    effect(() => {
      const userId = this.userId();
      untracked(() => this.synchronizeSession(userId));
    });
    inject(DestroyRef).onDestroy(() => this.synchronizeSession(null));
  }

  has(productId: string): boolean {
    return this.productIds().has(productId);
  }

  toggle(product: Product): void {
    this.synchronizeSession(this.userId());
    this.enqueue(
      this.has(product.id) ? { kind: 'remove', productId: product.id } : { kind: 'add', product },
    );
  }

  remove(productId: string): void {
    this.enqueue({ kind: 'remove', productId });
  }

  clear(): void {
    this.enqueue({ kind: 'clear' });
  }

  private synchronizeSession(userId: string | null): void {
    if (this.activeSession?.userId === userId) return;
    this.activeSession?.subscription.unsubscribe();
    this.activeSession?.requests.complete();
    this.activeSession = null;
    this.productsState.set([]);
    if (!userId) return;

    const scope: FavoritesSession = {
      userId,
      confirmed: [],
      pending: [],
      requests: new Subject<Mutation | null>(),
      subscription: new Subscription(),
    };
    this.activeSession = scope;
    // Load and writes share one queue, so a late load cannot overwrite an optimistic edit
    // and repeated clicks reach the server in the same order as the user's actions.
    scope.subscription.add(
      scope.requests.pipe(concatMap((mutation) => this.execute(scope, mutation))).subscribe(),
    );
    scope.requests.next(null);
  }

  private enqueue(mutation: Mutation): void {
    this.synchronizeSession(this.userId());
    const scope = this.activeSession;
    if (!scope) return;
    scope.pending.push(mutation);
    this.render(scope);
    scope.requests.next(mutation);
  }

  private execute(scope: FavoritesSession, mutation: Mutation | null): Observable<unknown> {
    if (scope !== this.activeSession || scope.userId !== this.userId()) return EMPTY;
    const request: Observable<unknown> =
      mutation === null
        ? this.api.getAll().pipe(tap((products) => (scope.confirmed = products)))
        : this.write(mutation).pipe(
            tap(() => (scope.confirmed = applyMutation(scope.confirmed, mutation))),
          );
    return request.pipe(
      // Global error handling reports the failure. Drop only this pending mutation;
      // later optimistic edits are reapplied to the last confirmed server state.
      catchError(() => EMPTY),
      // Completion also runs after a swallowed HTTP error, but not after cancellation.
      tap({
        complete: () => {
          scope.pending = scope.pending.filter((pending) => pending !== mutation);
          this.render(scope);
        },
      }),
    );
  }

  private write(mutation: Mutation): Observable<void> {
    switch (mutation.kind) {
      case 'add':
        return this.api.add(mutation.product.id);
      case 'remove':
        return this.api.remove(mutation.productId);
      case 'clear':
        return this.api.clear();
    }
  }

  private render(scope: FavoritesSession): void {
    if (scope !== this.activeSession || scope.userId !== this.userId()) return;
    this.productsState.set(scope.pending.reduce(applyMutation, scope.confirmed));
  }
}

function applyMutation(products: readonly Product[], mutation: Mutation): readonly Product[] {
  switch (mutation.kind) {
    case 'add':
      return [
        ...products.filter((product) => product.id !== mutation.product.id),
        mutation.product,
      ];
    case 'remove':
      return products.filter((product) => product.id !== mutation.productId);
    case 'clear':
      return [];
  }
}
