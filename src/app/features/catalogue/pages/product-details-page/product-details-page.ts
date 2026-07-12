import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';

import { AuthenticationSessionService } from '../../../auth/data-access/authentication-session.service';
import { BasketService } from '../../../basket/data-access/basket.service';
import { FavoritesService } from '../../../favorites/data-access/favorites.service';
import { ProductInformation } from '../../components/product-information/product-information';
import { ProductsRepository } from '../../data-access/products.repository';
import { type Product } from '../../models/product';

type DetailStatus = 'loading' | 'success' | 'not-found' | 'error';

@Component({
  selector: 'app-product-details-page',
  imports: [CurrencyPipe, ProductInformation, RouterLink],
  templateUrl: './product-details-page.html',
  styleUrl: './product-details-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailsPage {
  private readonly repository = inject(ProductsRepository);
  private readonly basket = inject(BasketService);
  private readonly destroyRef = inject(DestroyRef);
  readonly favorites = inject(FavoritesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(AuthenticationSessionService);

  readonly product = signal<Product | null>(null);
  readonly status = signal<DetailStatus>('loading');
  readonly quantity = signal(1);
  readonly added = signal(false);
  readonly effectivePrice = computed(() => {
    const product = this.product();
    return product ? (product.salePrice ?? product.price) : 0;
  });
  readonly saving = computed(() => {
    const product = this.product();
    return product?.salePrice ? product.price - product.salePrice : 0;
  });
  readonly isAuthenticated = this.session.isAuthenticated;
  readonly addButtonLabel = computed(() => {
    if (!this.isAuthenticated()) return $localize`:@@signInToAdd:Sign in to add`;
    return this.added()
      ? $localize`:@@addedToBasket:Added to basket`
      : $localize`:@@addToBasket:Add to basket`;
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => ({
          groupId: params.get('groupId') ?? '',
          productId: params.get('productId') ?? '',
        })),
        tap(() => this.status.set('loading')),
        switchMap(({ groupId, productId }) =>
          this.repository.getById(groupId, productId).pipe(
            catchError(() => {
              this.status.set('error');
              return of(undefined);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((product) => {
        if (product === undefined) return;
        this.product.set(product);
        this.status.set(product ? 'success' : 'not-found');
      });
  }

  increment(): void {
    this.quantity.update((value) => Math.min(value + 1, 10));
  }

  decrement(): void {
    this.quantity.update((value) => Math.max(value - 1, 1));
  }

  addToBasket(): void {
    const product = this.product();
    if (!product?.inStock) return;
    if (!this.session.isAuthenticated()) {
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/products/${product.groupId}/${product.id}` },
      });
      return;
    }
    this.basket.add(product, this.quantity());
    this.added.set(true);
  }

  toggleFavorite(): void {
    const product = this.product();
    if (product) this.favorites.toggle(product);
  }
}
