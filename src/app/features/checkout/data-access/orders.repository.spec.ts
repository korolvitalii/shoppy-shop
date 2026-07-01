import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApiOrdersRepository } from './orders.repository';

describe('ApiOrdersRepository', () => {
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
});
