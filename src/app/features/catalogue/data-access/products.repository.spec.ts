import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { apiErrorInterceptor } from '../../../core/errors/api-error.interceptor';
import { APP_ERROR_CODES, AppError } from '../../../core/errors/app-error';
import { SKIP_ERROR_NOTIFICATION } from '../../../core/errors/error-context';
import { ErrorNotificationService } from '../../../core/errors/error-notification.service';
import { SKIP_GLOBAL_LOADING } from '../../../core/loading/loading-context';
import { prerender, shipWithPage } from '../../../core/prerender/prerender-snapshot.testing';
import { type Product } from '../../../shared/domain/product';
import { type ProductPage, type ProductSearchQuery } from '../models/product';
import { ApiProductsRepository, StaticProductsRepository } from './products.repository';

const baseQuery: ProductSearchQuery = {
  search: '',
  sort: 'featured',
  price: 'all',
  inStock: false,
  isNew: false,
  giftWrappable: false,
};

describe('ApiProductsRepository', () => {
  it.each([false, true])(
    'returns null for HTTP 404 with error normalization enabled: %s',
    (normalize) => {
      TestBed.configureTestingModule({
        providers: [
          ApiProductsRepository,
          provideHttpClient(withInterceptors(normalize ? [apiErrorInterceptor] : [])),
          provideHttpClientTesting(),
        ],
      });
      const repository = TestBed.inject(ApiProductsRepository);
      const http = TestBed.inject(HttpTestingController);
      const emitted: (Product | null)[] = [];
      const completed = vi.fn();

      repository.getById('beauty', 'missing').subscribe({
        next: (product) => emitted.push(product),
        complete: completed,
      });
      http
        .expectOne('/api/product-groups/beauty/products/missing')
        .flush(null, { status: 404, statusText: 'Not Found' });

      expect(emitted).toEqual([null]);
      expect(completed).toHaveBeenCalledOnce();
      expect(TestBed.inject(ErrorNotificationService).current()).toBeNull();
      http.verify();
    },
  );

  it('still propagates and reports server failures', () => {
    TestBed.configureTestingModule({
      providers: [
        ApiProductsRepository,
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const repository = TestBed.inject(ApiProductsRepository);
    const http = TestBed.inject(HttpTestingController);
    const failed = vi.fn();

    repository.getById('beauty', 'beauty-1').subscribe({ error: failed });
    http
      .expectOne('/api/product-groups/beauty/products/beauty-1')
      .flush(null, { status: 503, statusText: 'Unavailable' });

    expect(failed).toHaveBeenCalledWith(expect.any(AppError));
    expect(failed.mock.calls[0][0].status).toBe(503);
    expect(TestBed.inject(ErrorNotificationService).current()?.code).toBe(APP_ERROR_CODES.server);
    http.verify();
  });

  it('uses the global products endpoint when searching all categories', () => {
    TestBed.configureTestingModule({
      providers: [ApiProductsRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    const repository = TestBed.inject(ApiProductsRepository);
    const http = TestBed.inject(HttpTestingController);

    repository
      .search('all', {
        search: 'lamp',
        sort: 'featured',
        price: 'all',
        inStock: false,
        isNew: false,
        giftWrappable: false,
      })
      .subscribe();

    const request = http.expectOne(
      (candidate) => candidate.url === '/api/products' && candidate.params.get('search') === 'lamp',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.has('cursor')).toBe(false);
    request.flush({ items: [], nextCursor: null, totalCount: 0 } satisfies ProductPage);
  });

  it('forwards the in-stock, new, and gift-wrappable filters', () => {
    TestBed.configureTestingModule({
      providers: [ApiProductsRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    const repository = TestBed.inject(ApiProductsRepository);
    const http = TestBed.inject(HttpTestingController);

    repository
      .search('all', {
        search: '',
        sort: 'featured',
        price: 'all',
        inStock: true,
        isNew: true,
        giftWrappable: true,
      })
      .subscribe();

    const request = http.expectOne((candidate) => candidate.url === '/api/products');
    expect(request.request.params.get('inStock')).toBe('true');
    expect(request.request.params.get('isNew')).toBe('true');
    expect(request.request.params.get('giftWrappable')).toBe('true');
    request.flush({ items: [], nextCursor: null, totalCount: 0 } satisfies ProductPage);
  });

  it('forwards the cursor and page size when asking for a later page', () => {
    TestBed.configureTestingModule({
      providers: [ApiProductsRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    const repository = TestBed.inject(ApiProductsRepository);
    const http = TestBed.inject(HttpTestingController);

    repository
      .search(
        'beauty',
        {
          search: '',
          sort: 'name',
          price: 'all',
          inStock: false,
          isNew: false,
          giftWrappable: false,
        },
        { cursor: 'abc123', limit: 6 },
      )
      .subscribe();

    const request = http.expectOne(
      (candidate) => candidate.url === '/api/product-groups/beauty/products',
    );
    expect(request.request.params.get('cursor')).toBe('abc123');
    expect(request.request.params.get('limit')).toBe('6');
    request.flush({ items: [], nextCursor: null, totalCount: 0 } satisfies ProductPage);
  });
});

describe('ApiProductsRepository on a prerendered page', () => {
  let removeState: (() => void) | undefined;

  const hydrateFrom = (render: (server: StaticProductsRepository) => void) => {
    const state = prerender([StaticProductsRepository], () =>
      render(TestBed.inject(StaticProductsRepository)),
    );
    TestBed.configureTestingModule({
      providers: [
        ApiProductsRepository,
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    removeState = shipWithPage(state);
    return {
      repository: TestBed.inject(ApiProductsRepository),
      http: TestBed.inject(HttpTestingController),
    };
  };

  afterEach(() => removeState?.());

  it('hydrates a listing with its prerendered first page, minus the offset cursor', () => {
    let prerendered!: ProductPage;
    const { repository, http } = hydrateFrom((server) =>
      server.search('beauty', baseQuery, { limit: 4 }).subscribe((page) => (prerendered = page)),
    );
    const emitted: ProductPage[] = [];

    // A fresh object, as the listing page builds its own query from the URL.
    repository
      .search('beauty', { ...baseQuery }, { limit: 4 })
      .subscribe((page) => emitted.push(page));

    expect(prerendered.nextCursor).toBe('4');
    expect(emitted).toEqual([{ ...prerendered, nextCursor: null }]);

    const request = http.expectOne(
      (candidate) => candidate.url === '/api/product-groups/beauty/products',
    );
    expect(request.request.context.get(SKIP_ERROR_NOTIFICATION)).toBe(true);
    expect(request.request.context.get(SKIP_GLOBAL_LOADING)).toBe(true);
    const live: ProductPage = {
      items: prerendered.items,
      nextCursor: 'api-cursor',
      totalCount: 15,
    };
    request.flush(live);

    expect(emitted).toEqual([{ ...prerendered, nextCursor: null }, live]);
    http.verify();
  });

  it('hydrates a details page with its prerendered product', () => {
    let prerendered: Product | null = null;
    const { repository, http } = hydrateFrom((server) =>
      server.getById('beauty', 'beauty-1').subscribe((product) => (prerendered = product)),
    );
    const emitted: (Product | null)[] = [];

    repository.getById('beauty', 'beauty-1').subscribe((product) => emitted.push(product));

    expect(prerendered).not.toBeNull();
    expect(emitted).toEqual([prerendered]);
    http.expectOne('/api/product-groups/beauty/products/beauty-1').flush(prerendered);
    expect(emitted).toEqual([prerendered, prerendered]);
    http.verify();
  });

  it('replaces a prerendered product with null when the live request returns 404', () => {
    let prerendered: Product | null = null;
    const { repository, http } = hydrateFrom((server) =>
      server.getById('beauty', 'beauty-1').subscribe((product) => (prerendered = product)),
    );
    const emitted: (Product | null)[] = [];

    repository.getById('beauty', 'beauty-1').subscribe((product) => emitted.push(product));
    expect(emitted).toEqual([prerendered]);
    http
      .expectOne('/api/product-groups/beauty/products/beauty-1')
      .flush(null, { status: 404, statusText: 'Not Found' });

    expect(prerendered).not.toBeNull();
    expect(emitted).toEqual([prerendered, null]);
    expect(TestBed.inject(ErrorNotificationService).current()).toBeNull();
    http.verify();
  });

  it('keeps a prerendered product when the live request fails with a server error', () => {
    let prerendered: Product | null = null;
    const { repository, http } = hydrateFrom((server) =>
      server.getById('beauty', 'beauty-1').subscribe((product) => (prerendered = product)),
    );
    const emitted: (Product | null)[] = [];

    repository.getById('beauty', 'beauty-1').subscribe((product) => emitted.push(product));
    http
      .expectOne('/api/product-groups/beauty/products/beauty-1')
      .flush(null, { status: 503, statusText: 'Unavailable' });

    expect(prerendered).not.toBeNull();
    expect(emitted).toEqual([prerendered]);
    expect(TestBed.inject(ErrorNotificationService).current()).toBeNull();
    http.verify();
  });

  it('only hydrates the query that was prerendered', () => {
    const { repository, http } = hydrateFrom((server) =>
      server.search('beauty', baseQuery).subscribe(),
    );
    const emitted: ProductPage[] = [];

    repository
      .search('beauty', { ...baseQuery, sort: 'name' })
      .subscribe((page) => emitted.push(page));

    expect(emitted).toEqual([]);
    const request = http.expectOne(
      (candidate) => candidate.url === '/api/product-groups/beauty/products',
    );
    expect(request.request.context.get(SKIP_GLOBAL_LOADING)).toBe(false);
    request.flush({ items: [], nextCursor: null, totalCount: 0 } satisfies ProductPage);
    http.verify();
  });
});

describe('StaticProductsRepository', () => {
  let repository: StaticProductsRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [StaticProductsRepository] });
    repository = TestBed.inject(StaticProductsRepository);
  });

  it('lists featured products in the order the API does, so hydration does not reshuffle them', () => {
    let ids: string[] = [];

    repository
      .search('beauty', baseQuery, { limit: 4 })
      .subscribe((page) => (ids = page.items.map((product) => product.id)));

    expect(ids).toEqual(['beauty-1', 'beauty-10', 'beauty-11', 'beauty-12']);
  });

  it('serves and filters the stable catalogue used by prerendering', () => {
    let products = 0;
    let productName = '';

    repository.search('beauty', baseQuery).subscribe((page) => (products = page.items.length));
    repository
      .getById('beauty', 'beauty-1')
      .subscribe((result) => (productName = result?.name ?? ''));

    expect(products).toBe(15);
    expect(productName).toBe('Vetiver & Cedar Eau de Parfum');
  });

  it('reports the total count only on the first page of a listing', () => {
    let firstPage!: ProductPage;
    let secondPage!: ProductPage;

    repository.search('beauty', baseQuery, { limit: 4 }).subscribe((page) => (firstPage = page));
    repository
      .search('beauty', baseQuery, { cursor: firstPage.nextCursor, limit: 4 })
      .subscribe((page) => (secondPage = page));

    expect(firstPage.totalCount).toBe(15);
    expect(secondPage.totalCount).toBeNull();
  });

  it('filters by in-stock, new, and gift-wrappable flags', () => {
    let inStockCount = 0;
    let newCount = 0;
    let giftWrappableCount = 0;

    repository
      .search('beauty', { ...baseQuery, inStock: true })
      .subscribe((page) => (inStockCount = page.items.length));
    repository
      .search('beauty', { ...baseQuery, isNew: true })
      .subscribe((page) => (newCount = page.items.length));
    repository
      .search('beauty', { ...baseQuery, giftWrappable: true })
      .subscribe((page) => (giftWrappableCount = page.items.length));

    expect(inStockCount).toBeLessThanOrEqual(15);
    expect(newCount).toBeGreaterThan(0);
    expect(newCount).toBeLessThan(15);
    expect(giftWrappableCount).toBeGreaterThan(0);
    expect(giftWrappableCount).toBeLessThan(15);
  });

  it('walks its offset cursor to the end of a category without repeating a product', () => {
    const ids: string[] = [];
    let cursor: string | null = null;

    do {
      let page!: ProductPage;
      repository.search('beauty', baseQuery, { cursor, limit: 4 }).subscribe((result) => {
        page = result;
      });
      ids.push(...page.items.map((product) => product.id));
      cursor = page.nextCursor;
    } while (cursor);

    expect(ids.length).toBe(15);
    expect(new Set(ids).size).toBe(15);
  });
});
