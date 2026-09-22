import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { OrdersRepository } from '../../data-access/orders.repository';
import { type Order } from '../../models/order.models';
import { OrderConfirmationPage } from './order-confirmation-page';

const baseOrder: Order = {
  id: 'ORD-00042',
  createdAt: '2026-07-06T12:00:00Z',
  status: 'confirmed',
  lines: [
    {
      productId: 'p1',
      groupId: 'g1',
      name: 'Product A',
      imageUrl: 'img-a.jpg',
      unitPrice: 25,
      quantity: 2,
    },
    {
      productId: 'p2',
      groupId: 'g1',
      name: 'Product B',
      imageUrl: 'img-b.jpg',
      unitPrice: 15,
      quantity: 1,
    },
  ],
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
  subtotal: 65,
  deliveryCharge: 4.99,
  total: 69.99,
};

async function render(order: Order | null, overrides: Partial<Order> = {}) {
  const value = order ? { ...order, ...overrides } : null;
  await TestBed.configureTestingModule({
    imports: [OrderConfirmationPage],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { paramMap: of(convertToParamMap({ orderId: value?.id ?? 'ORD-NOTFOUND' })) },
      },
      { provide: OrdersRepository, useValue: { getOrderById: vi.fn(() => of(value)) } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(OrderConfirmationPage);
  fixture.detectChanges();
  return fixture;
}

describe('OrderConfirmationPage', () => {
  it('renders the poster and the receipt for a loaded order', async () => {
    const fixture = await render(baseOrder);

    const panel: HTMLElement = fixture.nativeElement.querySelector('.panel');
    expect(panel.textContent).toContain('Order ORD-00042');
    expect(panel.textContent).toContain('alex@example.test');

    const announcement: HTMLElement = fixture.nativeElement.querySelector('[role="status"]');
    expect(announcement.textContent).toContain('Order ORD-00042 confirmed.');
    expect(announcement.contains(panel)).toBe(false);

    const lines: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.receipt-line'),
    );
    expect(lines[0].textContent).toContain('Product A');
    expect(lines[0].textContent).toContain('× 2');
    expect(lines[0].textContent).toContain('£50.00');
    expect(lines[1].textContent).toContain('Product B');
    expect(lines[1].textContent).toContain('£15.00');

    const deliveryLine = lines.find((line) => line.textContent?.includes('Standard delivery'));
    expect(deliveryLine?.textContent).toContain('£4.99');

    expect(fixture.nativeElement.querySelector('.receipt-total-value').textContent).toContain(
      '£69.99',
    );
    expect(fixture.nativeElement.querySelector('a[href="/orders"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/products"]')).toBeTruthy();
  });

  it('shows the arrival window for a dated order', async () => {
    const fixture = await render(baseOrder, { createdAt: '2026-07-03T12:00:00Z' });

    const stats: HTMLElement = fixture.nativeElement.querySelector('.poster-stats');
    expect(stats.textContent).toContain('Estimated arrival');
    expect(stats.textContent).toContain('8 Jul');
  });

  it('keeps the total paid but drops the arrival window when the order date is unusable', async () => {
    const fixture = await render(baseOrder, { createdAt: 'not-a-date' });

    const stats: HTMLElement = fixture.nativeElement.querySelector('.poster-stats');
    expect(stats.textContent).toContain('Total paid');
    expect(stats.textContent).not.toContain('Estimated arrival');
    expect(stats.textContent).not.toContain('Invalid Date');
  });

  it('displays the error state when the order cannot be loaded', async () => {
    const fixture = await render(null);

    const errorSection: HTMLElement = fixture.nativeElement.querySelector('.error-section');
    expect(errorSection.textContent).toContain('Order unavailable');
    expect(fixture.nativeElement.querySelector('a[href="/orders"]')).toBeTruthy();
  });
});
