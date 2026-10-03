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
import { map, switchMap, tap } from 'rxjs';

import { SeoService } from '../../../../core/seo/seo.service';
import { type Product } from '../../../../shared/domain/product';
import { ProductCard } from '../../../../shared/ui/product-card/product-card';
import { AuthenticationSessionService } from '../../../auth/public-api';
import { BasketService } from '../../../basket/public-api';
import { FavoritesService } from '../../../favorites/public-api';
import { ProductInformation } from '../../components/product-information/product-information';
import {
  type ProductDetailsEvent,
  ProductDetailsLoader,
} from '../../data-access/product-details.loader';

type DetailStatus = 'loading' | 'success' | 'not-found' | 'error';

interface ProductSelection {
  groupId: string;
  productId: string;
}

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
  providers: [ProductDetailsLoader],
  templateUrl: './product-details-page.html',
  styleUrl: './product-details-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailsPage {
  private readonly loader = inject(ProductDetailsLoader);
  private readonly basket = inject(BasketService);
  private readonly destroyRef = inject(DestroyRef);
  readonly favorites = inject(FavoritesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(AuthenticationSessionService);
  private readonly seo = inject(SeoService);
  private selectedProduct: ProductSelection | null = null;

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
  readonly favoriteButtonLabel = computed(() => {
    const product = this.product();
    return product && this.favorites.has(product.id)
      ? $localize`:@@removeFromFavourites:Remove from favourites`
      : $localize`:@@addToFavourites:Add to favourites`;
  });
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
        tap((selection) => this.resetForProduct(selection)),
        switchMap(({ groupId, productId }) => this.loader.load(groupId, productId)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.applyDetailEvent(event));
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

  private resetForProduct(selection: ProductSelection): void {
    this.status.set('loading');
    this.related.set([]);
    this.relatedTotal.set(null);

    if (
      this.selectedProduct?.groupId !== selection.groupId ||
      this.selectedProduct?.productId !== selection.productId
    ) {
      this.quantity.set(1);
      this.added.set(false);
    }
    this.selectedProduct = selection;
  }

  private applyDetailEvent(event: ProductDetailsEvent): void {
    switch (event.kind) {
      case 'product':
        this.product.set(event.product);
        this.status.set('success');
        this.applyProductSeo(event.product);
        break;
      case 'related':
        this.related.set(event.related);
        this.relatedTotal.set(event.total);
        break;
      case 'not-found':
        this.product.set(null);
        this.status.set('not-found');
        this.applyNotFoundSeo();
        break;
      case 'error':
        this.status.set('error');
        break;
    }
  }

  private applyProductSeo(product: Product): void {
    this.seo.apply({
      title: product.name,
      description: product.description,
      path: `/products/${product.groupId}/${product.id}`,
      image: product.imageUrl,
      indexable: true,
      type: 'product',
      structuredData: this.seo.productStructuredData(product),
    });
  }

  private applyNotFoundSeo(): void {
    this.seo.apply({
      title: $localize`:@@seoProductNotFoundTitle:Product not found`,
      description: $localize`:@@seoProductNotFoundDescription:This product is not available.`,
      path: '/products',
      indexable: false,
    });
  }
}
