import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { type ProductPage } from '../models/product';
import { ApiProductsRepository, StaticProductsRepository } from './products.repository';

describe('ApiProductsRepository', () => {
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

describe('StaticProductsRepository', () => {
  const baseQuery = {
    search: '',
    sort: 'featured',
    price: 'all',
    inStock: false,
    isNew: false,
    giftWrappable: false,
  } as const;

  it('serves and filters the stable catalogue used by prerendering', () => {
    const repository = new StaticProductsRepository();
    let products = 0;
    let productName = '';

    repository.search('beauty', baseQuery).subscribe((page) => (products = page.items.length));
    repository
      .getById('beauty', 'beauty-1')
      .subscribe((result) => (productName = result?.name ?? ''));

    expect(products).toBe(9);
    expect(productName).toBe('Refined Ceramic Table');
  });

  it('reports the total count only on the first page of a listing', () => {
    const repository = new StaticProductsRepository();
    let firstPage!: ProductPage;
    let secondPage!: ProductPage;

    repository.search('beauty', baseQuery, { limit: 4 }).subscribe((page) => (firstPage = page));
    repository
      .search('beauty', baseQuery, { cursor: firstPage.nextCursor, limit: 4 })
      .subscribe((page) => (secondPage = page));

    expect(firstPage.totalCount).toBe(9);
    expect(secondPage.totalCount).toBeNull();
  });

  it('filters by in-stock, new, and gift-wrappable flags', () => {
    const repository = new StaticProductsRepository();
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

    expect(inStockCount).toBeLessThanOrEqual(9);
    expect(newCount).toBeGreaterThan(0);
    expect(newCount).toBeLessThan(9);
    expect(giftWrappableCount).toBeGreaterThan(0);
    expect(giftWrappableCount).toBeLessThan(9);
  });

  it('walks its offset cursor to the end of a category without repeating a product', () => {
    const repository = new StaticProductsRepository();
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

    expect(ids.length).toBe(9);
    expect(new Set(ids).size).toBe(9);
  });
});
