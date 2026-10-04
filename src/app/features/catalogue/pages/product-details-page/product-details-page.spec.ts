import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, finalize, of, Subject, throwError } from 'rxjs';

import { apiErrorInterceptor } from '../../../../core/errors/api-error.interceptor';
import { ErrorNotificationService } from '../../../../core/errors/error-notification.service';
import { prerender, shipWithPage } from '../../../../core/prerender/prerender-snapshot.testing';
import { type Product } from '../../../../shared/domain/product';
import { AuthenticationSessionService } from '../../../auth/public-api';
import { BasketService } from '../../../basket/public-api';
import { FavoritesService } from '../../../favorites/public-api';
import {
  ApiProductsRepository,
  ProductsRepository,
  StaticProductsRepository,
} from '../../data-access/products.repository';
import { type ProductPage } from '../../models/product';
import { ProductDetailsPage } from './product-details-page';

describe('ProductDetailsPage', () => {
  let params = new BehaviorSubject(
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
    params = new BehaviorSubject(
      convertToParamMap({ groupId: 'electronics', productId: 'headphones' }),
    );
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

  it('updates the product when it arrives again without re-requesting the rail', () => {
    // A hydrating page gets the product twice: as prerendered, then live.
    const relatedResponse = new Subject<{
      items: Product[];
      nextCursor: string | null;
      totalCount: number | null;
    }>();
    repository.search.mockReturnValue(relatedResponse);
    const fixture = TestBed.createComponent(ProductDetailsPage);
    fixture.detectChanges();
    response.next(product);
    fixture.componentInstance.increment();
    fixture.componentInstance.addToBasket();
    response.next({ ...product, inStock: false });
    response.complete();
    relatedResponse.next({
      items: [{ ...product, id: 'earbuds', name: 'Wireless earbuds' }],
      nextCursor: null,
      totalCount: 12,
    });
    relatedResponse.complete();
    fixture.detectChanges();

    expect(repository.search).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.product()?.inStock).toBe(false);
    expect(fixture.componentInstance.quantity()).toBe(2);
    expect(fixture.componentInstance.added()).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('app-product-card').length).toBe(1);
  });

  it.each([
    { groupId: 'electronics', productId: 'earbuds' },
    { groupId: 'audio', productId: 'headphones' },
  ])('resets purchase state when navigating to $groupId/$productId', (selection) => {
    const other: Product = { ...product, id: 'earbuds', name: 'Wireless earbuds' };
    repository.search.mockReturnValue(of({ items: [other], nextCursor: null, totalCount: 12 }));
    const fixture = TestBed.createComponent(ProductDetailsPage);
    response.next(product);
    fixture.componentInstance.increment();
    fixture.componentInstance.addToBasket();
    expect(fixture.componentInstance.related()).toEqual([other]);

    const nextResponse = new Subject<Product | null>();
    repository.getById.mockReturnValueOnce(nextResponse);
    params.next(convertToParamMap(selection));

    expect(repository.getById).toHaveBeenLastCalledWith(selection.groupId, selection.productId);
    expect(fixture.componentInstance.status()).toBe('loading');
    expect(fixture.componentInstance.quantity()).toBe(1);
    expect(fixture.componentInstance.added()).toBe(false);
    expect(fixture.componentInstance.related()).toEqual([]);
    expect(fixture.componentInstance.relatedTotal()).toBeNull();

    const nextProduct = { ...product, groupId: selection.groupId, id: selection.productId };
    nextResponse.next(nextProduct);
    fixture.componentInstance.addToBasket();
    expect(basket.add).toHaveBeenLastCalledWith(nextProduct, 1);
  });

  it('preserves purchase state when the same route identifiers emit again', () => {
    const fixture = TestBed.createComponent(ProductDetailsPage);
    response.next(product);
    fixture.componentInstance.increment();
    fixture.componentInstance.addToBasket();

    params.next(convertToParamMap({ groupId: product.groupId, productId: product.id }));
    response.next(product);

    expect(fixture.componentInstance.quantity()).toBe(2);
    expect(fixture.componentInstance.added()).toBe(true);
  });

  it('updates the rendered product and SEO from synchronous hydration', () => {
    const liveProduct = { ...product, name: 'Updated headphones', inStock: false };
    repository.getById.mockReturnValue(of(product, liveProduct));
    const fixture = TestBed.createComponent(ProductDetailsPage);
    fixture.detectChanges();

    expect(fixture.componentInstance.product()).toEqual(liveProduct);
    expect(fixture.componentInstance.status()).toBe('success');
    expect(fixture.nativeElement.querySelector('[data-testid="add-to-basket"]').disabled).toBe(
      true,
    );
    expect(TestBed.inject(Title).getTitle()).toBe('Updated headphones | ShoppyShop');
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('index,follow');
  });

  it('cancels the previous product and related requests when navigating to another product', () => {
    const productCancelled = vi.fn();
    const relatedCancelled = vi.fn();
    const relatedResponse = new Subject<ProductPage>();
    repository.getById.mockReturnValue(response.pipe(finalize(productCancelled)));
    repository.search.mockReturnValue(relatedResponse.pipe(finalize(relatedCancelled)));
    const fixture = TestBed.createComponent(ProductDetailsPage);
    response.next(product);

    const nextProduct = { ...product, id: 'earbuds', name: 'Wireless earbuds' };
    const nextResponse = new Subject<Product | null>();
    repository.getById.mockReturnValueOnce(nextResponse);
    repository.search.mockReturnValueOnce(of({ items: [], nextCursor: null, totalCount: 0 }));
    params.next(convertToParamMap({ groupId: nextProduct.groupId, productId: nextProduct.id }));

    expect(productCancelled).toHaveBeenCalledOnce();
    expect(relatedCancelled).toHaveBeenCalledOnce();
    nextResponse.next(nextProduct);
    response.next(product);
    relatedResponse.next({ items: [product], nextCursor: null, totalCount: 12 });

    expect(fixture.componentInstance.product()).toEqual(nextProduct);
    expect(fixture.componentInstance.related()).toEqual([]);
    expect(fixture.componentInstance.relatedTotal()).toBe(0);
  });

  it('loads another product after a product request fails', () => {
    const fixture = TestBed.createComponent(ProductDetailsPage);
    response.error(new Error('product unavailable'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Product unavailable',
    );

    const nextProduct = { ...product, id: 'earbuds', name: 'Wireless earbuds' };
    repository.getById.mockReturnValueOnce(of(nextProduct));
    params.next(convertToParamMap({ groupId: nextProduct.groupId, productId: nextProduct.id }));
    fixture.detectChanges();

    expect(fixture.componentInstance.status()).toBe('success');
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(nextProduct.name);
  });

  it('cancels pending product and related requests when the component is destroyed', () => {
    const productCancelled = vi.fn();
    const relatedCancelled = vi.fn();
    const relatedResponse = new Subject<ProductPage>();
    repository.getById.mockReturnValue(response.pipe(finalize(productCancelled)));
    repository.search.mockReturnValue(relatedResponse.pipe(finalize(relatedCancelled)));
    const fixture = TestBed.createComponent(ProductDetailsPage);
    response.next(product);

    fixture.destroy();
    expect(productCancelled).toHaveBeenCalledOnce();
    expect(relatedCancelled).toHaveBeenCalledOnce();

    params.next(convertToParamMap({ groupId: product.groupId, productId: 'earbuds' }));
    expect(repository.getById).toHaveBeenCalledOnce();
  });

  it('shows a not-found state when the live answer drops a prerendered product', () => {
    const fixture = TestBed.createComponent(ProductDetailsPage);
    fixture.detectChanges();
    response.next(product);
    response.next(null);
    response.complete();
    fixture.detectChanges();

    expect(fixture.componentInstance.status()).toBe('not-found');
    expect(fixture.componentInstance.product()).toBeNull();
    expect(TestBed.inject(Title).getTitle()).toBe('Product not found | ShoppyShop');
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex,follow');
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

describe('ProductDetailsPage with the API repository', () => {
  it.each([false, true])(
    'renders not-found for a real HTTP 404 during hydration: %s',
    async (hydrating) => {
      const state = hydrating
        ? prerender([StaticProductsRepository], () =>
            TestBed.inject(StaticProductsRepository).getById('beauty', 'beauty-1').subscribe(),
          )
        : null;
      await TestBed.configureTestingModule({
        imports: [ProductDetailsPage],
        providers: [
          provideRouter([]),
          provideHttpClient(withInterceptors([apiErrorInterceptor])),
          provideHttpClientTesting(),
          { provide: ProductsRepository, useClass: ApiProductsRepository },
          { provide: BasketService, useValue: { add: vi.fn() } },
          { provide: FavoritesService, useValue: { has: () => false, toggle: vi.fn() } },
          { provide: AuthenticationSessionService, useValue: { isAuthenticated: signal(true) } },
          {
            provide: ActivatedRoute,
            useValue: {
              paramMap: of(convertToParamMap({ groupId: 'beauty', productId: 'beauty-1' })),
            },
          },
        ],
      }).compileComponents();
      const removeState = state ? shipWithPage(state) : () => undefined;

      try {
        const fixture = TestBed.createComponent(ProductDetailsPage);
        fixture.detectChanges();
        const http = TestBed.inject(HttpTestingController);
        if (hydrating) {
          expect(fixture.componentInstance.status()).toBe('success');
          expect(fixture.nativeElement.querySelector('[data-testid="add-to-basket"]')).toBeTruthy();
          http
            .expectOne((request) => request.url === '/api/product-groups/beauty/products')
            .flush({ items: [], nextCursor: null, totalCount: 0 });
        }

        http
          .expectOne('/api/product-groups/beauty/products/beauty-1')
          .flush(null, { status: 404, statusText: 'Not Found' });
        fixture.detectChanges();

        expect(fixture.componentInstance.status()).toBe('not-found');
        expect(fixture.componentInstance.product()).toBeNull();
        expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
          'Product not found',
        );
        expect(fixture.nativeElement.querySelector('[data-testid="add-to-basket"]')).toBeNull();
        expect(TestBed.inject(Title).getTitle()).toBe('Product not found | ShoppyShop');
        expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex,follow');
        expect(TestBed.inject(ErrorNotificationService).current()).toBeNull();
        http.verify();
      } finally {
        removeState();
      }
    },
  );
});
