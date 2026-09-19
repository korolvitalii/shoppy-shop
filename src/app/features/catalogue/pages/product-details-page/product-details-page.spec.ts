import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';

import { type Product } from '../../../../shared/domain/product';
import { AuthenticationSessionService } from '../../../auth/public-api';
import { BasketService } from '../../../basket/public-api';
import { FavoritesService } from '../../../favorites/public-api';
import { ProductsRepository } from '../../data-access/products.repository';
import { ProductDetailsPage } from './product-details-page';

describe('ProductDetailsPage', () => {
  const params = new BehaviorSubject(
    convertToParamMap({ groupId: 'electronics', productId: 'headphones' }),
  );
  const repository = { search: vi.fn(), getById: vi.fn() };
  const basket = { add: vi.fn() };
  const favorites = { has: vi.fn(() => false), toggle: vi.fn() };
  const authenticated = signal(true);
  let response: Subject<Product | null>;

  const product: Product = {
    id: 'headphones',
    groupId: 'electronics',
    name: 'Studio headphones',
    brand: 'Sonic',
    description: 'Wireless noise-cancelling headphones for focused listening.',
    imageUrl: '/images/headphones.jpg',
    price: 249,
    salePrice: 199,
    inStock: true,
    isNew: false,
    giftWrappable: false,
  };

  beforeEach(async () => {
    response = new Subject<Product | null>();
    repository.getById.mockReset();
    repository.getById.mockReturnValue(response);
    repository.search.mockReset();
    repository.search.mockReturnValue(of({ items: [], nextCursor: null, totalCount: null }));
    basket.add.mockReset();
    authenticated.set(true);

    await TestBed.configureTestingModule({
      imports: [ProductDetailsPage],
      providers: [
        provideRouter([]),
        { provide: ProductsRepository, useValue: repository },
        { provide: BasketService, useValue: basket },
        { provide: FavoritesService, useValue: favorites },
        {
          provide: AuthenticationSessionService,
          useValue: { isAuthenticated: authenticated },
        },
        { provide: ActivatedRoute, useValue: { paramMap: params } },
      ],
    }).compileComponents();
  });

  it('loads a product from both route identifiers', () => {
    const fixture = TestBed.createComponent(ProductDetailsPage);
    fixture.detectChanges();

    expect(repository.getById).toHaveBeenCalledWith('electronics', 'headphones');
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Loading product',
    );
  });

  it('renders product information, sale pricing, and stock status', () => {
    const fixture = TestBed.createComponent(ProductDetailsPage);
    fixture.detectChanges();
    response.next(product);
    response.complete();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Studio headphones');
    expect(element.textContent).toContain('£199.00');
    expect(element.textContent).toContain('Save £50.00');
    expect(element.textContent).toContain('In stock');
    expect(element.textContent).toContain(product.description);
    expect(element.textContent).toContain('Ready to dispatch');
    expect(element.textContent).toContain('Tracked delivery');
    expect(element.querySelector('[role="tablist"]')).toBeNull();
    expect(element.querySelector('img')?.alt).toBe('Studio headphones');
  });

  it('changes quantity and adds the selected amount to the basket', () => {
    const fixture = TestBed.createComponent(ProductDetailsPage);
    fixture.detectChanges();
    response.next(product);
    response.complete();
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector('[aria-label="Increase quantity"]') as HTMLButtonElement
    ).click();
    (
      fixture.nativeElement.querySelector('[data-testid="add-to-basket"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(basket.add).toHaveBeenCalledWith(product, 2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Added to basket');
  });

  it('redirects anonymous customers to login without changing the basket', () => {
    authenticated.set(false);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ProductDetailsPage);
    fixture.detectChanges();
    response.next(product);
    response.complete();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="add-to-basket"]')?.textContent).toContain(
      'Sign in to add',
    );
    expect(element.querySelector('a[href="/basket"]')).toBeNull();
    (element.querySelector('[data-testid="add-to-basket"]') as HTMLButtonElement).click();

    expect(basket.add).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/products/electronics/headphones' },
    });
  });

  it('shows related products from the same category, excluding the current product', () => {
    const other: Product = { ...product, id: 'earbuds', name: 'Wireless earbuds' };
    repository.search.mockReturnValue(
      of({ items: [product, other], nextCursor: null, totalCount: 12 }),
    );
    const fixture = TestBed.createComponent(ProductDetailsPage);
    fixture.detectChanges();
    response.next(product);
    response.complete();
    fixture.detectChanges();

    expect(repository.search).toHaveBeenCalledWith(
      'electronics',
      expect.objectContaining({ search: '' }),
      { limit: 5 },
    );
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('app-product-card').length).toBe(1);
    expect(element.textContent).toContain('Wireless earbuds');
    expect(element.textContent).toContain('All 12');
  });

  it('renders the product before the related rail resolves', () => {
    const relatedResponse = new Subject<{
      items: Product[];
      nextCursor: string | null;
      totalCount: number | null;
    }>();
    repository.search.mockReturnValue(relatedResponse);
    const fixture = TestBed.createComponent(ProductDetailsPage);
    fixture.detectChanges();
    response.next(product);
    response.complete();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.status()).toBe('success');
    expect(element.querySelector('h1')?.textContent).toContain('Studio headphones');
    expect(element.querySelectorAll('app-product-card').length).toBe(0);

    relatedResponse.next({
      items: [{ ...product, id: 'earbuds', name: 'Wireless earbuds' }],
      nextCursor: null,
      totalCount: 12,
    });
    relatedResponse.complete();
    fixture.detectChanges();

    expect(element.querySelectorAll('app-product-card').length).toBe(1);
  });

  it('keeps the product usable when the related rail fails to load', () => {
    repository.search.mockReturnValue(throwError(() => new Error('rail unavailable')));
    const fixture = TestBed.createComponent(ProductDetailsPage);
    fixture.detectChanges();
    response.next(product);
    response.complete();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.status()).toBe('success');
    expect(element.textContent).toContain('Studio headphones');
    expect(element.querySelector('[data-testid="add-to-basket"]')).toBeTruthy();
    expect(element.querySelector('.related')).toBeNull();
  });

  it('shows a not-found state for an unknown product', () => {
    const fixture = TestBed.createComponent(ProductDetailsPage);
    fixture.detectChanges();
    response.next(null);
    response.complete();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Product not found');
    expect(fixture.nativeElement.querySelector('a[href="/products"]')).toBeTruthy();
  });
});
