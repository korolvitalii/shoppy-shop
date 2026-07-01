import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';

import { OrdersRepository } from '../../../checkout/data-access/orders.repository';
import { type Order } from '../../../checkout/models/checkout.models';
import { OrderHistoryPage } from './order-history-page';

describe('OrderHistoryPage', () => {
  const repository = { getOrders: vi.fn() };
  let response: Subject<readonly Order[]>;

  beforeEach(async () => {
    response = new Subject<readonly Order[]>();
    repository.getOrders.mockReset();
    repository.getOrders.mockReturnValue(response);

    await TestBed.configureTestingModule({
      imports: [OrderHistoryPage],
      providers: [provideRouter([]), { provide: OrdersRepository, useValue: repository }],
    }).compileComponents();
  });

  it('shows loading and renders purchases returned by the API', () => {
    const fixture = TestBed.createComponent(OrderHistoryPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Loading purchases',
    );

    response.next([createOrder()]);
    response.complete();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('ORD-00003');
    expect(element.textContent).toContain('Studio headphones');
    expect(element.textContent).toContain('£204.99');
    expect(element.textContent).toContain('Visa ending in 4242');
    expect(element.querySelectorAll('article')).toHaveLength(1);
  });

  it('provides an empty state when the customer has no purchases', () => {
    const fixture = TestBed.createComponent(OrderHistoryPage);
    fixture.detectChanges();
    response.next([]);
    response.complete();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No purchases yet');
    expect(fixture.nativeElement.querySelector('a[href="/products"]')).toBeTruthy();
  });

  it('announces request failures and retries', () => {
    const retryResponse = new Subject<readonly Order[]>();
    repository.getOrders.mockReturnValueOnce(response).mockReturnValueOnce(retryResponse);
    const fixture = TestBed.createComponent(OrderHistoryPage);
    fixture.detectChanges();
    response.error(new Error('Unavailable'));
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('We could not load your purchases');
    (alert.querySelector('button') as HTMLButtonElement).click();
    expect(repository.getOrders).toHaveBeenCalledTimes(2);
  });
});

function createOrder(): Order {
  return {
    id: 'ORD-00003',
    createdAt: '2026-06-28T14:20:00.000Z',
    status: 'confirmed',
    lines: [
      {
        productId: 'electronics-1',
        groupId: 'electronics',
        name: 'Studio headphones',
        imageUrl: '/headphones.jpg',
        unitPrice: 200,
        quantity: 1,
      },
    ],
    delivery: {
      name: 'Demo Customer',
      email: 'demo@shoppyshop.test',
      address: '10 Market Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'United Kingdom',
    },
    deliveryMethod: 'standard',
    paymentToken: { tokenId: 'tok_demo', brand: 'Visa', last4: '4242' },
    subtotal: 200,
    deliveryCharge: 4.99,
    total: 204.99,
  };
}
