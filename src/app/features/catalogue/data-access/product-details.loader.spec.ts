import { TestBed } from '@angular/core/testing';
import { defer, finalize, of, Subject, throwError } from 'rxjs';

import { type Product } from '../../../shared/domain/product';
import { type ProductPage } from '../models/product';
import { type ProductDetailsEvent, ProductDetailsLoader } from './product-details.loader';
import { ProductsRepository } from './products.repository';

describe('ProductDetailsLoader', () => {
  const repository = { getById: vi.fn(), search: vi.fn() };
  const product: Product = {
    id: 'headphones',
    groupId: 'electronics',
    name: 'Studio headphones',
    brand: 'Sonic',
    description: 'Wireless headphones.',
    imageUrl: '/images/headphones.jpg',
    price: 249,
    salePrice: 199,
    inStock: true,
    isNew: false,
    giftWrappable: false,
  };
  let loader: ProductDetailsLoader;

  beforeEach(() => {
    repository.getById.mockReset();
    repository.getById.mockReturnValue(of(product));
    repository.search.mockReset();
    repository.search.mockReturnValue(of({ items: [], nextCursor: null, totalCount: null }));
    TestBed.configureTestingModule({
      providers: [ProductDetailsLoader, { provide: ProductsRepository, useValue: repository }],
    });
    loader = TestBed.inject(ProductDetailsLoader);
  });

  it('shares a synchronous product source and loads the related rail once', () => {
    const liveProduct = { ...product, inStock: false };
    const subscribeToProduct = vi.fn(() => of(product, liveProduct));
    repository.getById.mockReturnValue(defer(subscribeToProduct));
    const events: ProductDetailsEvent[] = [];

    loader.load(product.groupId, product.id).subscribe((event) => events.push(event));

    expect(repository.getById).toHaveBeenCalledWith(product.groupId, product.id);
    expect(subscribeToProduct).toHaveBeenCalledOnce();
    expect(repository.search).toHaveBeenCalledOnce();
    expect(events).toEqual([
      { kind: 'product', product },
      { kind: 'related', related: [], total: null },
      { kind: 'product', product: liveProduct },
    ]);
  });

  it('keeps a pending related request through a live product update and product completion', () => {
    const response = new Subject<Product | null>();
    const relatedResponse = new Subject<ProductPage>();
    repository.getById.mockReturnValue(response);
    repository.search.mockReturnValue(relatedResponse);
    const events: ProductDetailsEvent[] = [];
    const completed = vi.fn();
    loader.load(product.groupId, product.id).subscribe({
      next: (event) => events.push(event),
      complete: completed,
    });

    const liveProduct = { ...product, inStock: false };
    response.next(product);
    response.next(liveProduct);
    response.complete();

    expect(events).toEqual([
      { kind: 'product', product },
      { kind: 'product', product: liveProduct },
    ]);
    expect(completed).not.toHaveBeenCalled();

    const other = { ...product, id: 'earbuds' };
    relatedResponse.next({ items: [other], nextCursor: null, totalCount: 12 });
    relatedResponse.complete();

    expect(repository.search).toHaveBeenCalledOnce();
    expect(events.at(-1)).toEqual({ kind: 'related', related: [other], total: 12 });
    expect(completed).toHaveBeenCalledOnce();
  });

  it.each([true, false])(
    'limits related products to four when the current product is in the page: %s',
    (includesCurrent) => {
      const others = Array.from({ length: 5 }, (_, index) => ({
        ...product,
        id: `related-${index}`,
      }));
      const items = includesCurrent ? [product, ...others.slice(0, 4)] : others;
      repository.search.mockReturnValue(of({ items, nextCursor: null, totalCount: 12 }));
      const events: ProductDetailsEvent[] = [];

      loader.load(product.groupId, product.id).subscribe((event) => events.push(event));

      expect(repository.search).toHaveBeenCalledWith(
        product.groupId,
        {
          search: '',
          sort: 'featured',
          price: 'all',
          inStock: false,
          isNew: false,
          giftWrappable: false,
        },
        { limit: 5 },
      );
      expect(events.at(-1)).toEqual({ kind: 'related', related: others.slice(0, 4), total: 12 });
    },
  );

  it('emits not-found without requesting related products for a missing product', () => {
    repository.getById.mockReturnValue(of(null));
    const events: ProductDetailsEvent[] = [];

    loader.load(product.groupId, product.id).subscribe((event) => events.push(event));

    expect(events).toEqual([{ kind: 'not-found' }]);
    expect(repository.search).not.toHaveBeenCalled();
  });

  it('starts the related rail if a live product follows a missing prerendered product', () => {
    repository.getById.mockReturnValue(of(null, product));
    const events: ProductDetailsEvent[] = [];

    loader.load(product.groupId, product.id).subscribe((event) => events.push(event));

    expect(events).toEqual([
      { kind: 'not-found' },
      { kind: 'product', product },
      { kind: 'related', related: [], total: null },
    ]);
    expect(repository.search).toHaveBeenCalledOnce();
  });

  it('converts a product request failure into an error event', () => {
    repository.getById.mockReturnValue(throwError(() => new Error('product unavailable')));
    const events: ProductDetailsEvent[] = [];
    const completed = vi.fn();

    loader.load(product.groupId, product.id).subscribe({
      next: (event) => events.push(event),
      complete: completed,
    });

    expect(events).toEqual([{ kind: 'error' }]);
    expect(repository.search).not.toHaveBeenCalled();
    expect(completed).toHaveBeenCalledOnce();
  });

  it('continues emitting product updates when the related request fails', () => {
    const liveProduct = { ...product, inStock: false };
    repository.getById.mockReturnValue(of(product, liveProduct));
    repository.search.mockReturnValue(throwError(() => new Error('rail unavailable')));
    const events: ProductDetailsEvent[] = [];

    loader.load(product.groupId, product.id).subscribe((event) => events.push(event));

    expect(events).toEqual([
      { kind: 'product', product },
      { kind: 'product', product: liveProduct },
    ]);
    expect(repository.search).toHaveBeenCalledOnce();
  });

  it('cancels product and related requests when the caller unsubscribes', () => {
    const response = new Subject<Product | null>();
    const relatedResponse = new Subject<ProductPage>();
    const productCancelled = vi.fn();
    const relatedCancelled = vi.fn();
    repository.getById.mockReturnValue(response.pipe(finalize(productCancelled)));
    repository.search.mockReturnValue(relatedResponse.pipe(finalize(relatedCancelled)));
    const events: ProductDetailsEvent[] = [];
    const subscription = loader
      .load(product.groupId, product.id)
      .subscribe((event) => events.push(event));
    response.next(product);

    subscription.unsubscribe();
    response.next({ ...product, inStock: false });
    relatedResponse.next({ items: [product], nextCursor: null, totalCount: 12 });

    expect(productCancelled).toHaveBeenCalledOnce();
    expect(relatedCancelled).toHaveBeenCalledOnce();
    expect(events).toEqual([{ kind: 'product', product }]);
  });
});
