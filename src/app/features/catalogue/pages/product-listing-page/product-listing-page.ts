import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
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
  take,
  takeUntil,
  tap,
} from 'rxjs';

import { SeoService } from '../../../../core/seo/seo.service';
import { type Product } from '../../../../shared/domain/product';
import { ProductCard } from '../../../../shared/ui/product-card/product-card';
import { AuthenticationSessionService } from '../../../auth/public-api';
import { FavoritesService } from '../../../favorites/public-api';
import { CatalogueFilters } from '../../components/catalogue-filters/catalogue-filters';
import catalogue from '../../data/catalogue.json';
import { ProductGroupsRepository } from '../../data-access/product-groups.repository';
import { ProductsRepository } from '../../data-access/products.repository';
import { type PriceRange, type ProductSearchQuery, type ProductSort } from '../../models/product';
import { type ProductGroup } from '../../models/product-group';

type RequestStatus = 'loading' | 'success' | 'error';

function priceRangeLabel(price: PriceRange): string {
  switch (price) {
    case '0-50':
      return $localize`:@@priceFilterChipUnder50:Under £50`;
    case '50-200':
      return $localize`:@@priceFilterChip50To200:£50–£200`;
    case '200+':
      return $localize`:@@priceFilterChipOver200:£200 and over`;
    default:
      return '';
  }
}

@Component({
  selector: 'app-product-listing-page',
  imports: [CatalogueFilters, ProductCard, ReactiveFormsModule, RouterLink],
  templateUrl: './product-listing-page.html',
  styleUrl: './product-listing-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListingPage {
  protected readonly favorites = inject(FavoritesService);
  private readonly repository = inject(ProductsRepository);
  private readonly groupsRepository = inject(ProductGroupsRepository);
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
  readonly query = signal<ProductSearchQuery>({
    search: '',
    sort: 'featured',
    price: 'all',
    inStock: false,
    isNew: false,
    giftWrappable: false,
  });
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly nextCursor = signal<string | null>(null);
  readonly totalCount = signal<number | null>(null);
  readonly loadingMore = signal(false);
  readonly loadMoreFailed = signal(false);
  readonly categories = signal<readonly ProductGroup[]>([]);

  protected readonly activeFilterChips = computed(() => {
    const query = this.query();
    const chips: { key: 'price' | 'inStock' | 'isNew' | 'giftWrappable'; label: string }[] = [];
    if (query.price !== 'all') {
      chips.push({ key: 'price', label: priceRangeLabel(query.price) });
    }
    if (query.inStock) {
      chips.push({ key: 'inStock', label: $localize`:@@inStockOnly:In stock only` });
    }
    if (query.isNew) {
      chips.push({ key: 'isNew', label: $localize`:@@newThisSeason:New this season` });
    }
    if (query.giftWrappable) {
      chips.push({ key: 'giftWrappable', label: $localize`:@@giftWrappableLabel:Gift-wrappable` });
    }
    return chips;
  });

  constructor() {
    this.groupsRepository
      .getAll()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((groups) => this.categories.set(groups));

    combineLatest([this.route.paramMap, this.route.queryParamMap, this.refresh])
      .pipe(
        map(([params, queryParams]) => ({
          groupId: params.get('groupId') ?? 'all',
          query: {
            search: queryParams.get('search') ?? '',
            sort: (queryParams.get('sort') ?? 'featured') as ProductSort,
            price: (queryParams.get('price') ?? 'all') as PriceRange,
            inStock: queryParams.get('inStock') === 'true',
            isNew: queryParams.get('isNew') === 'true',
            giftWrappable: queryParams.get('giftWrappable') === 'true',
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
          this.totalCount.set(page.totalCount);
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

  setSort(sort: ProductSort): void {
    this.updateQuery({ sort });
  }

  setPrice(price: PriceRange): void {
    this.updateQuery({ price: price === 'all' ? null : price });
  }

  setInStock(value: boolean): void {
    this.updateQuery({ inStock: value ? 'true' : null });
  }

  setIsNew(value: boolean): void {
    this.updateQuery({ isNew: value ? 'true' : null });
  }

  setGiftWrappable(value: boolean): void {
    this.updateQuery({ giftWrappable: value ? 'true' : null });
  }

  retry(): void {
    this.refresh.next(this.refresh.value + 1);
  }

  clearFilters(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  resetSidebarFilters(): void {
    this.updateQuery({ price: null, inStock: null, isNew: null, giftWrappable: null });
  }

  protected toggleFavorite(product: Product): void {
    if (!this.session.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.favorites.toggle(product);
  }

  protected categoryName(groupId: string): string | null {
    return this.categories().find((group) => group.id === groupId)?.name ?? null;
  }

  protected removeFilterChip(key: 'price' | 'inStock' | 'isNew' | 'giftWrappable'): void {
    if (key === 'price') this.setPrice('all');
    if (key === 'inStock') this.setInStock(false);
    if (key === 'isNew') this.setIsNew(false);
    if (key === 'giftWrappable') this.setGiftWrappable(false);
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
