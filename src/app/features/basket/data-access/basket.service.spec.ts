import { TestBed } from '@angular/core/testing';

import { type Product } from '../../../shared/domain/product';
import { BasketService } from './basket.service';

describe('BasketService', () => {
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

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => vi.restoreAllMocks());

  it('adds products, aggregates quantities, and persists non-sensitive basket data', () => {
    const service = TestBed.inject(BasketService);

    service.add(product, 2);
    service.add(product, 1);

    expect(service.itemCount()).toBe(3);
    expect(service.items()[0]).toMatchObject({
      productId: 'headphones',
      unitPrice: 199,
      quantity: 3,
    });
    expect(localStorage.getItem('shoppyshop.basket.v1')).toContain('headphones');
  });

  const savedItem = {
    productId: product.id,
    groupId: product.groupId,
    name: product.name,
    imageUrl: product.imageUrl,
    unitPrice: 199,
    quantity: 2,
  };

  it('restores validated items before reporting readiness', async () => {
    localStorage.setItem('shoppyshop.basket.v1', JSON.stringify([savedItem]));
    const service = TestBed.inject(BasketService);

    await service.restored;

    expect(service.items()).toEqual([savedItem]);
    expect(service.itemCount()).toBe(2);
    expect(service.subtotal()).toBe(398);
  });

  it.each([
    '{',
    JSON.stringify([{ productId: 'injected', quantity: -20 }]),
    JSON.stringify([{ ...savedItem, quantity: 0 }]),
    JSON.stringify([{ ...savedItem, unitPrice: -1 }]),
  ])('settles with an empty basket for invalid storage: %s', async (value) => {
    localStorage.setItem('shoppyshop.basket.v1', value);

    const service = TestBed.inject(BasketService);
    await service.restored;

    expect(service.items()).toEqual([]);
    expect(service.itemCount()).toBe(0);
  });

  it('settles when storage is empty', async () => {
    const service = TestBed.inject(BasketService);
    await service.restored;
    expect(service.itemCount()).toBe(0);
  });

  it('settles when browser storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    const service = TestBed.inject(BasketService);
    await service.restored;
    expect(service.items()).toEqual([]);
  });

  it.each(['add', 'remove', 'clear'] as const)(
    'keeps a newer %s action when restoration completes',
    async (action) => {
      localStorage.setItem('shoppyshop.basket.v1', JSON.stringify([savedItem]));
      const service = TestBed.inject(BasketService);

      if (action === 'add') service.add(product, 3);
      else if (action === 'remove') service.remove(product.id);
      else service.clear();
      await service.restored;

      expect(service.itemCount()).toBe(action === 'add' ? 3 : 0);
      expect(JSON.parse(localStorage.getItem('shoppyshop.basket.v1')!)).toEqual(service.items());
    },
  );
});
