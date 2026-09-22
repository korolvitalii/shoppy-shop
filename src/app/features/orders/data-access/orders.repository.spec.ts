import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApiOrdersRepository } from './orders.repository';

describe('ApiOrdersRepository', () => {
  it('sends the idempotency key when creating an order', () => {
    TestBed.configureTestingModule({
      providers: [ApiOrdersRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    const repository = TestBed.inject(ApiOrdersRepository);
    const http = TestBed.inject(HttpTestingController);

    repository.createOrder({} as never, 'key-123').subscribe();

    const request = http.expectOne('/api/orders');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Idempotency-Key')).toBe('key-123');
    request.flush({});
  });

  it('loads the current customer order history', () => {
    TestBed.configureTestingModule({
      providers: [ApiOrdersRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    const repository = TestBed.inject(ApiOrdersRepository);
    const http = TestBed.inject(HttpTestingController);
    let result: unknown;

    repository.getOrders().subscribe((orders) => (result = orders));
    const request = http.expectOne('/api/orders');
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 'ORD-00003' }]);

    expect(result).toEqual([{ id: 'ORD-00003' }]);
  });

  it('seeks past the given cursor when loading a later page of order history', () => {
    TestBed.configureTestingModule({
      providers: [ApiOrdersRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    const repository = TestBed.inject(ApiOrdersRepository);
    const http = TestBed.inject(HttpTestingController);

    repository.getOrders({ before: '2026-01-01T00:00:00.000Z', beforeId: 'ORD-00010' }).subscribe();

    const request = http.expectOne(
      (req) =>
        req.url === '/api/orders' &&
        req.params.get('before') === '2026-01-01T00:00:00.000Z' &&
        req.params.get('beforeId') === 'ORD-00010',
    );
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
