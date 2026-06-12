import { convertToParamMap, provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject } from 'rxjs';

import { Product } from '../../models/product';
import { ProductsRepository } from '../../data-access/products.repository';
import { ProductListingPage } from './product-listing-page';

describe('ProductListingPage', () => {
  const params = new BehaviorSubject(convertToParamMap({ groupId: 'electronics' }));
  const queryParams = new BehaviorSubject(convertToParamMap({}));
  const repository = { search: vi.fn() };
  let response: Subject<readonly Product[]>;

  beforeEach(async () => {
    response = new Subject<readonly Product[]>();
    repository.search.mockReset();
    repository.search.mockReturnValue(response);
    params.next(convertToParamMap({ groupId: 'electronics' }));
    queryParams.next(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [ProductListingPage],
      providers: [
        provideRouter([]),
        { provide: ProductsRepository, useValue: repository },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: params, queryParamMap: queryParams },
        },
      ],
    }).compileComponents();
  });

  it('loads products using route and query-parameter state', () => {
    queryParams.next(convertToParamMap({ search: 'audio', sort: 'price-asc', price: '50-200' }));
    const fixture = TestBed.createComponent(ProductListingPage);
    fixture.detectChanges();

    expect(repository.search).toHaveBeenCalledWith('electronics', {
      search: 'audio',
      sort: 'price-asc',
      price: '50-200',
    });
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Loading products',
    );
  });

  it('renders products returned by the repository', () => {
    const fixture = TestBed.createComponent(ProductListingPage);
    fixture.detectChanges();
    response.next([
      {
        id: 'headphones',
        groupId: 'electronics',
        name: 'Studio headphones',
        brand: 'Sonic',
        description: 'Wireless noise-cancelling headphones.',
        imageUrl: '/images/headphones.jpg',
        price: 249,
        salePrice: 199,
        inStock: true,
      },
    ]);
    response.complete();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Studio headphones');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('1 product');
    expect(
      fixture.nativeElement.querySelector('a[href="/products/electronics/headphones"]'),
    ).toBeTruthy();
  });

  it('shows an empty result and an API error state', () => {
    const fixture = TestBed.createComponent(ProductListingPage);
    fixture.detectChanges();
    response.next([]);
    response.complete();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No products match');
  });
});
