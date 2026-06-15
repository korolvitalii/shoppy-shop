import { TestBed } from '@angular/core/testing';

import { Product } from '../../catalogue/models/product';
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
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

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

  it('discards malformed or untrusted persisted data', () => {
    localStorage.setItem(
      'shoppyshop.basket.v1',
      JSON.stringify([{ productId: 'injected', quantity: -20 }]),
    );

    const service = TestBed.inject(BasketService);

    expect(service.items()).toEqual([]);
    expect(service.itemCount()).toBe(0);
  });
});
