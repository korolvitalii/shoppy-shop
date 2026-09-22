import { CurrencyPipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
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
import { catchError, concat, EMPTY, map, of, switchMap, tap } from 'rxjs';

import { SeoService } from '../../../../core/seo/seo.service';
import { type Product } from '../../../../shared/domain/product';
import { ProductCard } from '../../../../shared/ui/product-card/product-card';
import { AuthenticationSessionService } from '../../../auth/public-api';
import { BasketService } from '../../../basket/public-api';
import { FavoritesService } from '../../../favorites/public-api';
import { ProductInformation } from '../../components/product-information/product-information';
import { ProductsRepository } from '../../data-access/products.repository';
import { type ProductSearchQuery } from '../../models/product';

type DetailStatus = 'loading' | 'success' | 'not-found' | 'error';

type DetailEvent =
  | { kind: 'product'; product: Product }
  | { kind: 'related'; related: readonly Product[]; total: number | null }
  | { kind: 'not-found' }
  | { kind: 'error' };

const RELATED_PRODUCTS_QUERY: ProductSearchQuery = {
  search: '',
  sort: 'featured',
  price: 'all',
  inStock: false,
  isNew: false,
  giftWrappable: false,
};

@Component({
  selector: 'app-product-details-page',
  imports: [
    CurrencyPipe,
    TitleCasePipe,
    UpperCasePipe,
    ProductCard,
    ProductInformation,
    RouterLink,
  ],
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
  private readonly seo = inject(SeoService);

  readonly product = signal<Product | null>(null);
  readonly related = signal<readonly Product[]>([]);
  readonly relatedTotal = signal<number | null>(null);
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
        tap(() => {
          this.status.set('loading');
          this.related.set([]);
          this.relatedTotal.set(null);
        }),
        switchMap(({ groupId, productId }) =>
          this.repository.getById(groupId, productId).pipe(
            switchMap((product) => {
              if (!product) return of<DetailEvent>({ kind: 'not-found' });
              const related = this.repository
                .search(product.groupId, RELATED_PRODUCTS_QUERY, { limit: 5 })
                .pipe(
                  map((page): DetailEvent => ({
                    kind: 'related',
                    related: page.items.filter((item) => item.id !== product.id).slice(0, 4),
                    total: page.totalCount,
                  })),
                  // The rail is supporting content: if it fails the product page stays usable.
                  catchError(() => EMPTY),
                );
              return concat(of<DetailEvent>({ kind: 'product', product }), related);
            }),
            catchError(() => of<DetailEvent>({ kind: 'error' })),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        switch (event.kind) {
          case 'product':
            this.product.set(event.product);
            this.status.set('success');
            this.seo.apply({
              title: event.product.name,
              description: event.product.description,
              path: `/products/${event.product.groupId}/${event.product.id}`,
              image: event.product.imageUrl,
              indexable: true,
              type: 'product',
              structuredData: this.seo.productStructuredData(event.product),
            });
            break;
          case 'related':
            this.related.set(event.related);
            this.relatedTotal.set(event.total);
            break;
          case 'not-found':
            this.product.set(null);
            this.status.set('not-found');
            this.seo.apply({
              title: $localize`:@@seoProductNotFoundTitle:Product not found`,
              description: $localize`:@@seoProductNotFoundDescription:This product is not available.`,
              path: '/products',
              indexable: false,
            });
            break;
          case 'error':
            this.status.set('error');
            break;
        }
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

  toggleFavorite(product: Product | null = this.product()): void {
    if (!product) return;
    if (!this.session.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.favorites.toggle(product);
  }
}
