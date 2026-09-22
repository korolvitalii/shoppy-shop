import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, provideRouter, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';

import { type Product } from '../../../../shared/domain/product';
import { ProductGroupsRepository } from '../../data-access/product-groups.repository';
import { ProductsRepository } from '../../data-access/products.repository';
import { type ProductPage } from '../../models/product';
import { type ProductGroup } from '../../models/product-group';
import { ProductListingPage } from './product-listing-page';

const product = (id: string, name: string): Product => ({
  id,
  groupId: 'electronics',
  name,
  brand: 'Sonic',
  description: 'Wireless noise-cancelling headphones.',
  imageUrl: '/images/headphones.jpg',
  price: 249,
  salePrice: 199,
  inStock: true,
  isNew: false,
  giftWrappable: false,
});

const baseQuery = {
  search: '',
  sort: 'featured' as const,
  price: 'all' as const,
  inStock: false,
  isNew: false,
  giftWrappable: false,
};

const categories: readonly ProductGroup[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'd',
    imageUrl: '/g.jpg',
    itemCount: 26,
    badge: null,
  },
];

describe('ProductListingPage', () => {
  const params = new BehaviorSubject(convertToParamMap({ groupId: 'electronics' }));
  const queryParams = new BehaviorSubject(convertToParamMap({}));
  const repository = { search: vi.fn() };
  const groupsRepository = { getAll: vi.fn() };
  let response: Subject<ProductPage>;

  beforeEach(async () => {
    response = new Subject<ProductPage>();
    repository.search.mockReset();
    repository.search.mockReturnValue(response);
    groupsRepository.getAll.mockReset();
    groupsRepository.getAll.mockReturnValue(of(categories));
    params.next(convertToParamMap({ groupId: 'electronics' }));
    queryParams.next(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [ProductListingPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProductsRepository, useValue: repository },
        { provide: ProductGroupsRepository, useValue: groupsRepository },
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
      ...baseQuery,
      search: 'audio',
      sort: 'price-asc',
      price: '50-200',
    });
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Loading products',
    );
  });

  it('uses the all-products collection for the global search route', () => {
    params.next(convertToParamMap({}));
    queryParams.next(convertToParamMap({ search: 'gift' }));
    const fixture = TestBed.createComponent(ProductListingPage);
    fixture.detectChanges();

    expect(repository.search).toHaveBeenCalledWith('all', { ...baseQuery, search: 'gift' });
  });

  it('parses the in-stock, new, and gift-wrappable query params into booleans', () => {
    queryParams.next(convertToParamMap({ inStock: 'true', isNew: 'true', giftWrappable: 'true' }));
    const fixture = TestBed.createComponent(ProductListingPage);
    fixture.detectChanges();

    expect(repository.search).toHaveBeenCalledWith('electronics', {
      ...baseQuery,
      inStock: true,
      isNew: true,
      giftWrappable: true,
    });
  });

  it('fetches categories once for the filter sidebar', () => {
    const fixture = TestBed.createComponent(ProductListingPage);
    fixture.detectChanges();

    expect(groupsRepository.getAll).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.categories()).toEqual(categories);
  });

  it('renders products returned by the repository', () => {
    const fixture = TestBed.createComponent(ProductListingPage);
    fixture.detectChanges();
    response.next({
      items: [product('headphones', 'Studio headphones')],
      nextCursor: null,
      totalCount: 1,
    });
    response.complete();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Studio headphones');
    expect(
      fixture.nativeElement.querySelector('a[href="/products/electronics/headphones"]'),
    ).toBeTruthy();
  });

  it('shows the total count once the first page resolves', () => {
    const fixture = TestBed.createComponent(ProductListingPage);
    fixture.detectChanges();
    response.next({
      items: [product('headphones', 'Studio headphones')],
      nextCursor: null,
      totalCount: 26,
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.totalCount()).toBe(26);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Showing 1 of 26');
  });

  it('shows an empty result and an API error state', () => {
    const fixture = TestBed.createComponent(ProductListingPage);
    fixture.detectChanges();
    response.next({ items: [], nextCursor: null, totalCount: 0 });
    response.complete();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No products match');
  });

  it('hides the load-more control once a page comes back without a cursor', () => {
    const fixture = TestBed.createComponent(ProductListingPage);
    fixture.detectChanges();
    response.next({
      items: [product('headphones', 'Studio headphones')],
      nextCursor: null,
      totalCount: 1,
    });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Load more');
  });

  it('appends the next page to the products already on screen', () => {
    const fixture = TestBed.createComponent(ProductListingPage);
    fixture.detectChanges();
    response.next({
      items: [product('headphones', 'Studio headphones')],
      nextCursor: 'cursor-1',
      totalCount: 2,
    });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Load more');

    const nextPage = new Subject<ProductPage>();
    repository.search.mockReturnValue(nextPage);
    element.querySelector<HTMLButtonElement>('.load-more button')!.click();

    expect(repository.search).toHaveBeenLastCalledWith('electronics', baseQuery, {
      cursor: 'cursor-1',
    });

    nextPage.next({
      items: [product('speaker', 'Desk speaker')],
      nextCursor: null,
      totalCount: null,
    });
    fixture.detectChanges();

    // The first page must still be on screen — this is append, not replace.
    expect(element.textContent).toContain('Studio headphones');
    expect(element.textContent).toContain('Desk speaker');
    expect(element.textContent).not.toContain('Load more');
  });

  /**
   * Clicks "Load more", then swaps the sort before that page resolves. Returns the abandoned
   * request so a test can decide how it eventually settles.
   */
  const loadMoreThenChangeFilters = (fixture: ComponentFixture<ProductListingPage>) => {
    response.next({
      items: [product('headphones', 'Studio headphones')],
      nextCursor: 'cursor-1',
      totalCount: 2,
    });
    fixture.detectChanges();

    const abandoned = new Subject<ProductPage>();
    repository.search.mockReturnValue(abandoned);
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.load-more button')!
      .click();

    const replacement = new Subject<ProductPage>();
    repository.search.mockReturnValue(replacement);
    queryParams.next(convertToParamMap({ sort: 'name' }));
    fixture.detectChanges();
    replacement.next({
      items: [product('lamp', 'Desk lamp')],
      nextCursor: 'cursor-2',
      totalCount: 1,
    });
    fixture.detectChanges();

    return { abandoned };
  };

  it('ignores a page that arrives after the filters have changed', () => {
    const fixture = TestBed.createComponent(ProductListingPage);
    fixture.detectChanges();
    const { abandoned } = loadMoreThenChangeFilters(fixture);

    // Those rows belong to the previous listing; appending them would interleave two result sets.
    abandoned.next({
      items: [product('speaker', 'Desk speaker')],
      nextCursor: null,
      totalCount: null,
    });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Desk lamp');
    expect(element.textContent).not.toContain('Desk speaker');
  });

  it('leaves the new listing able to page after abandoning an in-flight request', () => {
    const fixture = TestBed.createComponent(ProductListingPage);
    fixture.detectChanges();
    loadMoreThenChangeFilters(fixture);

    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector<HTMLButtonElement>('.load-more button')!;

    // The abandoned request must not leave the button stuck in its loading state, nor hold the
    // load-more stream open — both would strand the new listing on its first page.
    expect(button.disabled).toBe(false);
    expect(button.textContent).toContain('Load more');

    const nextPage = new Subject<ProductPage>();
    repository.search.mockReturnValue(nextPage);
    button.click();

    expect(repository.search).toHaveBeenLastCalledWith(
      'electronics',
      { ...baseQuery, sort: 'name' },
      { cursor: 'cursor-2' },
    );

    nextPage.next({
      items: [product('speaker', 'Desk speaker')],
      nextCursor: null,
      totalCount: null,
    });
    fixture.detectChanges();
    expect(element.textContent).toContain('Desk speaker');
  });

  it('does not report a failure of an abandoned request against the new listing', () => {
    const fixture = TestBed.createComponent(ProductListingPage);
    fixture.detectChanges();
    const { abandoned } = loadMoreThenChangeFilters(fixture);

    abandoned.error(new Error('network'));
    fixture.detectChanges();

    // The error belongs to a request the current listing never made.
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
      'Could not load more products',
    );
  });

  it('navigates with the in-stock filter merged into the current query params', () => {
    const fixture = TestBed.createComponent(ProductListingPage);
    fixture.detectChanges();
    response.next({ items: [], nextCursor: null, totalCount: 0 });
    fixture.detectChanges();

    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.setInStock(true);

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { inStock: 'true' },
      queryParamsHandling: 'merge',
    });
  });
});
