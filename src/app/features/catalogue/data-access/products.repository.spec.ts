import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

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
    request.flush([]);
  });
});

describe('StaticProductsRepository', () => {
  it('serves and filters the stable catalogue used by prerendering', () => {
    const repository = new StaticProductsRepository();
    let products = 0;
    let productName = '';

    repository
      .search('beauty', { search: '', sort: 'featured', price: 'all' })
      .subscribe((result) => (products = result.length));
    repository
      .getById('beauty', 'beauty-1')
      .subscribe((result) => (productName = result?.name ?? ''));

    expect(products).toBe(9);
    expect(productName).toBe('Refined Ceramic Table');
  });
});
