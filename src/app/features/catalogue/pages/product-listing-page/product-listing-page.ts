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
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';

import { SeoService } from '../../../../core/seo/seo.service';
import { ProductCard } from '../../components/product-card/product-card';
import catalogue from '../../data/catalogue.json';
import { ProductsRepository } from '../../data-access/products.repository';
import {
  type PriceRange,
  type Product,
  type ProductSearchQuery,
  type ProductSort,
} from '../../models/product';

type RequestStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-product-listing-page',
  imports: [ProductCard, ReactiveFormsModule, RouterLink],
  templateUrl: './product-listing-page.html',
  styleUrl: './product-listing-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListingPage {
  private readonly repository = inject(ProductsRepository);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refresh = new BehaviorSubject(0);
  private readonly seo = inject(SeoService);

  readonly products = signal<readonly Product[]>([]);
  readonly status = signal<RequestStatus>('loading');
  readonly groupId = signal('');
  readonly query = signal<ProductSearchQuery>({ search: '', sort: 'featured', price: 'all' });
  readonly searchControl = new FormControl('', { nonNullable: true });

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
      .subscribe((products) => {
        if (products) {
          this.products.set(products);
          this.status.set('success');
        }
      });

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((search) => this.updateQuery({ search: search || null }));
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
