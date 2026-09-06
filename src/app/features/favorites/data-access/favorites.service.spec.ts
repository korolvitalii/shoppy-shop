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

  afterEach(() => TestBed.inject(HttpTestingController).verify());

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

  it('cancels an outstanding load when the session ends', () => {
    const service = TestBed.inject(FavoritesService);
    const http = TestBed.inject(HttpTestingController);
    const session = TestBed.inject(AuthenticationSessionService);
    session.start(authResult);
    TestBed.flushEffects();
    const load = http.expectOne('/api/favorites');

    session.end();
    TestBed.flushEffects();

    expect(load.cancelled).toBe(true);
    expect(service.products()).toEqual([]);
  });

  it('cancels writes and discards queued changes when switching accounts', () => {
    const service = TestBed.inject(FavoritesService);
    const http = TestBed.inject(HttpTestingController);
    const session = TestBed.inject(AuthenticationSessionService);
    session.start(authResult);
    TestBed.flushEffects();
    http.expectOne('/api/favorites').flush([product]);
    service.remove(product.id);
    const removal = http.expectOne('/api/favorites/headphones');
    service.toggle({ ...product, id: 'speaker' });

    session.start({ ...authResult, user: { ...authResult.user, id: 'customer-2' } });
    TestBed.flushEffects();

    expect(removal.cancelled).toBe(true);
    expect(service.products()).toEqual([]);
    http.expectOne('/api/favorites').flush([]);
    http.expectNone('/api/favorites/speaker');
    expect(service.products()).toEqual([]);
  });

  it('does not restore a failed mutation after logout before the effect runs', () => {
    const service = TestBed.inject(FavoritesService);
    const http = TestBed.inject(HttpTestingController);
    const session = TestBed.inject(AuthenticationSessionService);
    session.start(authResult);
    TestBed.flushEffects();
    http.expectOne('/api/favorites').flush([product]);
    service.remove(product.id);
    const removal = http.expectOne('/api/favorites/headphones');

    session.end();
    removal.flush(null, { status: 500, statusText: 'Server error' });
    expect(service.products()).toEqual([]);
    TestBed.flushEffects();
  });

  it('preserves a later addition when an earlier removal fails', () => {
    const service = TestBed.inject(FavoritesService);
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthenticationSessionService).start(authResult);
    TestBed.flushEffects();
    http.expectOne('/api/favorites').flush([product]);
    const speaker = { ...product, id: 'speaker' };

    service.remove(product.id);
    const removal = http.expectOne('/api/favorites/headphones');
    service.toggle(speaker);
    expect(service.products()).toEqual([speaker]);
    http.expectNone('/api/favorites/speaker');

    removal.flush(null, { status: 500, statusText: 'Server error' });
    expect(service.products()).toEqual([product, speaker]);
    http.expectOne('/api/favorites/speaker').flush(null);
    expect(service.products()).toEqual([product, speaker]);
  });

  it('preserves later changes when clearing favourites fails', () => {
    const service = TestBed.inject(FavoritesService);
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthenticationSessionService).start(authResult);
    TestBed.flushEffects();
    http.expectOne('/api/favorites').flush([product]);
    service.clear();
    const clear = http.expectOne({ url: '/api/favorites', method: 'DELETE' });
    const speaker = { ...product, id: 'speaker' };
    service.toggle(speaker);

    clear.flush(null, { status: 500, statusText: 'Server error' });
    expect(service.products()).toEqual([product, speaker]);
    http.expectOne('/api/favorites/speaker').flush(null);
  });

  it('keeps edits made while the initial load is pending', () => {
    const service = TestBed.inject(FavoritesService);
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthenticationSessionService).start(authResult);
    TestBed.flushEffects();
    const load = http.expectOne('/api/favorites');
    service.toggle(product);
    expect(service.has(product.id)).toBe(true);

    load.flush([]);
    expect(service.has(product.id)).toBe(true);
    http.expectOne('/api/favorites/headphones').flush(null);
  });

  it('serializes repeated toggles of the same product and rolls back only the failed action', () => {
    const service = TestBed.inject(FavoritesService);
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthenticationSessionService).start(authResult);
    TestBed.flushEffects();
    http.expectOne('/api/favorites').flush([]);
    service.toggle(product);
    const add = http.expectOne({ url: '/api/favorites/headphones', method: 'PUT' });
    service.toggle(product);
    expect(service.products()).toEqual([]);
    http.expectNone({ url: '/api/favorites/headphones', method: 'DELETE' });

    add.flush(null);
    expect(service.products()).toEqual([]);
    http
      .expectOne({ url: '/api/favorites/headphones', method: 'DELETE' })
      .flush(null, { status: 500, statusText: 'Server error' });
    expect(service.products()).toEqual([product]);
  });
});
