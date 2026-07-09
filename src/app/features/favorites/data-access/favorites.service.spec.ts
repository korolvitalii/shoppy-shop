import { TestBed } from '@angular/core/testing';

import { type Product } from '../../catalogue/models/product';
import { FavoritesService } from './favorites.service';

const product: Product = {
  id: 'headphones',
  groupId: 'electronics',
  name: 'Quiet headphones',
  brand: 'Sonic',
  description: 'Comfortable wireless headphones.',
  imageUrl: '/headphones.jpg',
  price: 120,
  salePrice: null,
  inStock: true,
};

describe('FavoritesService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('toggles a product and persists it', () => {
    const service = TestBed.inject(FavoritesService);

    service.toggle(product);

    expect(service.has(product.id)).toBe(true);
    expect(service.count()).toBe(1);
    expect(localStorage.getItem('shoppyshop.favorites.v1')).toContain(product.id);

    service.toggle(product);
    expect(service.has(product.id)).toBe(false);
  });

  it('clears all favourite products', () => {
    const service = TestBed.inject(FavoritesService);
    service.toggle(product);

    service.clear();

    expect(service.products()).toEqual([]);
  });
});
