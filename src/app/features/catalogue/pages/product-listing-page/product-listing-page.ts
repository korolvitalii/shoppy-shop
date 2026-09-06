import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  exhaustMap,
  finalize,
  map,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

import { SeoService } from '../../../../core/seo/seo.service';
import { type Product } from '../../../../shared/domain/product';
import { ProductCard } from '../../../../shared/ui/product-card/product-card';
import { AuthenticationSessionService } from '../../../auth/public-api';
import { FavoritesService } from '../../../favorites/public-api';
import catalogue from '../../data/catalogue.json';
import { ProductsRepository } from '../../data-access/products.repository';
import { type PriceRange, type ProductSearchQuery, type ProductSort } from '../../models/product';

type RequestStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-product-listing-page',
  imports: [ProductCard, ReactiveFormsModule, RouterLink],
  templateUrl: './product-listing-page.html',
  styleUrl: './product-listing-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListingPage {
  protected readonly favorites = inject(FavoritesService);
  private readonly repository = inject(ProductsRepository);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refresh = new BehaviorSubject(0);
  private readonly seo = inject(SeoService);
  private readonly session = inject(AuthenticationSessionService);
  private readonly loadMoreRequests = new Subject<void>();

  /**
   * Fires whenever the filter/sort combination changes, to tear down any page still loading for the
   * listing being replaced.
   */
  private readonly listingChanges = new Subject<void>();

  readonly products = signal<readonly Product[]>([]);
  readonly status = signal<RequestStatus>('loading');
  readonly groupId = signal('');
  readonly query = signal<ProductSearchQuery>({ search: '', sort: 'featured', price: 'all' });
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly nextCursor = signal<string | null>(null);
  readonly loadingMore = signal(false);
  readonly loadMoreFailed = signal(false);

  constructor() {
    combineLatest([this.route.paramMap, this.route.queryParamMap, this.refresh])
      .pipe(
        map(([params, queryParams]) => ({
          groupId: params.get('groupId') ?? 'all',
          query: {
            search: queryParams.get('search') ?? '',
            sort: (queryParams.get('sort') ?? 'featured') as ProductSort,
            price: (queryParams.get('price') ?? 'all') as PriceRange,
          },
        })),
        tap(({ groupId, query }) => {
          this.groupId.set(groupId);
          this.query.set(query);
          this.searchControl.setValue(query.search, { emitEvent: false });
          this.status.set('loading');
          // A cursor is only valid for the query it was issued under, so a new listing always
          // restarts from the first page and abandons any page still loading for the old one.
          this.listingChanges.next();
          this.nextCursor.set(null);
          this.loadMoreFailed.set(false);
          this.updateSeo(groupId, query.search);
        }),
        switchMap(({ groupId, query }) =>
          this.repository.search(groupId, query).pipe(
            catchError(() => {
              this.status.set('error');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        if (page) {
          this.products.set(page.items);
          this.nextCursor.set(page.nextCursor);
          this.status.set('success');
        }
      });

    this.loadMoreRequests
      .pipe(
        // exhaustMap, not switchMap: a second click while a page is loading should be ignored
        // rather than cancel and restart it, which would append the same rows twice.
        exhaustMap(() => {
          const cursor = this.nextCursor();
          if (!cursor) return of(null);

          this.loadingMore.set(true);
          this.loadMoreFailed.set(false);
          return this.repository.search(this.groupId(), this.query(), { cursor }).pipe(
            // Abandon this page the moment the filters change. Without it the request outlives the
            // listing it belongs to: its rows are for a query nobody is looking at any more, it
            // keeps `loadingMore` set so the new listing's button stays disabled, it holds
            // exhaustMap open so the new listing cannot fetch anything further, and on failure it
            // reports an error against a listing that never made the request.
            takeUntil(this.listingChanges),
            catchError(() => {
              this.loadMoreFailed.set(true);
              return of(null);
            }),
            finalize(() => this.loadingMore.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        if (!page) return;
        this.products.update((current) => [...current, ...page.items]);
        this.nextCursor.set(page.nextCursor);
      });

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((search) => this.updateQuery({ search: search || null }));
  }

  loadMore(): void {
    this.loadMoreRequests.next();
  }

  updateFilter(key: 'sort' | 'price', event: Event): void {
    this.updateQuery({ [key]: (event.target as HTMLSelectElement).value });
  }

  retry(): void {
    this.refresh.next(this.refresh.value + 1);
  }

  clearFilters(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  protected toggleFavorite(product: Product): void {
    if (!this.session.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.favorites.toggle(product);
  }

  private updateQuery(queryParams: Record<string, string | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  private updateSeo(groupId: string, search: string): void {
    if (groupId === 'all') {
      this.seo.apply({
        title: $localize`:@@seoSearchTitle:Search products`,
        description: $localize`:@@seoSearchDescription:Search and filter the ShoppyShop catalogue.`,
        path: '/products/search',
        indexable: false,
      });
      return;
    }

    const group = catalogue.groups.find((item) => item.id === groupId);
    if (!group) return;
    const description = $localize`:@@seoCategoryDescription:Browse selected products from ${group.name}:categoryName: at ShoppyShop.`;
    this.seo.apply({
      title: `${group.name}${search ? ` – ${search}` : ''}`,
      description,
      path: `/products/${group.id}`,
      image: group.imageUrl,
      indexable: !search,
      structuredData: !search
        ? {
            '@context': 'https://schema.org',
            '@graph': [
              { '@type': 'CollectionPage', name: group.name, description },
              this.seo.breadcrumbStructuredData([
                { name: 'Products', path: '/products' },
                { name: group.name, path: `/products/${group.id}` },
              ]),
            ],
          }
        : undefined,
    });
  }
}
