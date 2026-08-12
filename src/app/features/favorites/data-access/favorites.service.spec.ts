import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { type Product } from '../../../shared/domain/product';
import { AuthenticationSessionService, type AuthResult } from '../../auth/public-api';
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

const authResult: AuthResult = {
  accessToken: 'token-1',
  accessTokenExpiresAt: '2026-01-01T00:00:00Z',
  user: { id: 'customer-1', email: 'demo@shoppyshop.test', displayName: null, roles: [] },
};

describe('FavoritesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('loads favourites from the API once the customer is authenticated', () => {
    const service = TestBed.inject(FavoritesService);
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthenticationSessionService).start(authResult);
    TestBed.flushEffects();

    http.expectOne('/api/favorites').flush([product]);

    expect(service.has(product.id)).toBe(true);
    expect(service.count()).toBe(1);
  });

  it('adds a favourite optimistically and calls the API', () => {
    const service = TestBed.inject(FavoritesService);
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthenticationSessionService).start(authResult);
    TestBed.flushEffects();
    http.expectOne('/api/favorites').flush([]);

    service.toggle(product);

    expect(service.has(product.id)).toBe(true);
    http.expectOne({ url: '/api/favorites/headphones', method: 'PUT' }).flush(null);
  });

  it('removes a favourite and reverts on request failure', () => {
    const service = TestBed.inject(FavoritesService);
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthenticationSessionService).start(authResult);
    TestBed.flushEffects();
    http.expectOne('/api/favorites').flush([product]);

    service.remove(product.id);
    expect(service.has(product.id)).toBe(false);

    http
      .expectOne({ url: '/api/favorites/headphones', method: 'DELETE' })
      .flush(null, { status: 500, statusText: 'Server error' });

    expect(service.has(product.id)).toBe(true);
  });

  it('clears local favourites when the session ends', () => {
    const service = TestBed.inject(FavoritesService);
    const http = TestBed.inject(HttpTestingController);
    const session = TestBed.inject(AuthenticationSessionService);
    session.start(authResult);
    TestBed.flushEffects();
    http.expectOne('/api/favorites').flush([product]);

    session.end();
    TestBed.flushEffects();

    expect(service.products()).toEqual([]);
  });
});
