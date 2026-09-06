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

    repository.search('all', { search: 'lamp', sort: 'featured', price: 'all' }).subscribe();

    const request = http.expectOne(
      (candidate) => candidate.url === '/api/products' && candidate.params.get('search') === 'lamp',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.has('cursor')).toBe(false);
    request.flush({ items: [], nextCursor: null } satisfies ProductPage);
  });

  it('forwards the cursor and page size when asking for a later page', () => {
    TestBed.configureTestingModule({
      providers: [ApiProductsRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    const repository = TestBed.inject(ApiProductsRepository);
    const http = TestBed.inject(HttpTestingController);

    repository
      .search('beauty', { search: '', sort: 'name', price: 'all' }, { cursor: 'abc123', limit: 6 })
      .subscribe();

    const request = http.expectOne(
      (candidate) => candidate.url === '/api/product-groups/beauty/products',
    );
    expect(request.request.params.get('cursor')).toBe('abc123');
    expect(request.request.params.get('limit')).toBe('6');
    request.flush({ items: [], nextCursor: null } satisfies ProductPage);
  });
});

describe('StaticProductsRepository', () => {
  it('serves and filters the stable catalogue used by prerendering', () => {
    const repository = new StaticProductsRepository();
    let products = 0;
    let productName = '';

    repository
      .search('beauty', { search: '', sort: 'featured', price: 'all' })
      .subscribe((page) => (products = page.items.length));
    repository
      .getById('beauty', 'beauty-1')
      .subscribe((result) => (productName = result?.name ?? ''));

    expect(products).toBe(9);
    expect(productName).toBe('Refined Ceramic Table');
  });

  it('walks its offset cursor to the end of a category without repeating a product', () => {
    const repository = new StaticProductsRepository();
    const query = { search: '', sort: 'featured', price: 'all' } as const;
    const ids: string[] = [];
    let cursor: string | null = null;

    do {
      let page!: ProductPage;
      repository.search('beauty', query, { cursor, limit: 4 }).subscribe((result) => {
        page = result;
      });
      ids.push(...page.items.map((product) => product.id));
      cursor = page.nextCursor;
    } while (cursor);

    expect(ids.length).toBe(9);
    expect(new Set(ids).size).toBe(9);
  });
});
