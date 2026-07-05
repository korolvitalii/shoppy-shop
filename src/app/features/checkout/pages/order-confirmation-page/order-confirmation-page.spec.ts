import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { OrdersRepository } from '../../data-access/orders.repository';
import { type Order } from '../../models/checkout.models';
import { OrderConfirmationPage } from './order-confirmation-page';

describe('OrderConfirmationPage', () => {
  it('announces the new order and links to purchase history', async () => {
    const order: Order = {
      id: 'ORD-00042',
      createdAt: '2026-07-05T15:00:00Z',
      status: 'confirmed',
      lines: [],
      delivery: {
        name: 'Alex Morgan',
        email: 'alex@example.test',
        address: '4 Market Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'United Kingdom',
      },
      deliveryMethod: 'standard',
      paymentToken: { tokenId: 'tok_1', brand: 'Visa', last4: '4242' },
      subtotal: 45,
      deliveryCharge: 4.99,
      total: 49.99,
    };
    await TestBed.configureTestingModule({
      imports: [OrderConfirmationPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ orderId: order.id })) },
        },
        { provide: OrdersRepository, useValue: { getOrderById: vi.fn(() => of(order)) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrderConfirmationPage);
    fixture.detectChanges();

    const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(status.textContent).toContain('ORD-00042');
    expect(status.textContent).toContain('alex@example.test');
    expect(status.textContent).toContain('£49.99');
    expect(status.querySelector('a[href="/orders"]')).toBeTruthy();
  });
});
