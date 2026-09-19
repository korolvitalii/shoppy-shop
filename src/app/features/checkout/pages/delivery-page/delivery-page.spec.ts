import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { type BasketItem } from '../../../basket/public-api';
import { CheckoutFacade } from '../../data-access/checkout.facade';
import { type CheckoutPaymentToken, type DeliveryAddress } from '../../models/checkout.models';
import { DeliveryPage } from './delivery-page';

describe('DeliveryPage', () => {
  const mockItems: BasketItem[] = [
    {
      productId: 'prod-1',
      groupId: 'home',
      name: 'Cushion',
      quantity: 2,
      unitPrice: 25.0,
      imageUrl: 'https://example.com/cushion.jpg',
    },
    {
      productId: 'prod-2',
      groupId: 'home',
      name: 'Throw',
      quantity: 1,
      unitPrice: 60.0,
      imageUrl: 'https://example.com/throw.jpg',
    },
  ];

  const facade = {
    delivery: signal<DeliveryAddress | null>(null),
    paymentToken: signal<CheckoutPaymentToken | null>(null),
    items: signal<BasketItem[]>(mockItems),
    itemCount: signal(3),
    subtotal: signal(110.0),
    deliveryCharge: signal(4.99),
    total: signal(114.99),
    setDelivery: vi.fn(),
  };

  beforeEach(async () => {
    facade.delivery.set(null);
    facade.paymentToken.set(null);
    facade.items.set(mockItems);
    facade.itemCount.set(3);
    facade.subtotal.set(110.0);
    facade.deliveryCharge.set(4.99);
    facade.total.set(114.99);
    facade.setDelivery.mockReset();
    await TestBed.configureTestingModule({
      imports: [DeliveryPage],
      providers: [provideRouter([]), { provide: CheckoutFacade, useValue: facade }],
    }).compileComponents();
  });

  it('requires typed delivery fields before continuing', () => {
    const f = TestBed.createComponent(DeliveryPage);
    f.detectChanges();
    f.componentInstance.continue();
    f.detectChanges();
    expect(facade.setDelivery).not.toHaveBeenCalled();
    expect(f.nativeElement.textContent).toContain('Name is required');
  });

  it('restores delivery details when returning from a later step', () => {
    facade.delivery.set({
      name: 'Alex Morgan',
      email: 'alex@example.test',
      address: '4 Market Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'United Kingdom',
    });

    const fixture = TestBed.createComponent(DeliveryPage);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.name.value).toBe('Alex Morgan');
    const backLink = fixture.nativeElement.querySelector('.back-link');
    expect(backLink).toBeTruthy();
    expect(backLink.getAttribute('href')).toBe('/basket');
  });

  it('keeps country values stable when option labels are translated', () => {
    const fixture = TestBed.createComponent(DeliveryPage);
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#country');
    const labels = ['Wielka Brytania', 'Irlandia', 'Francja', 'Niemcy', 'Hiszpania'];
    Array.from(select.options).forEach((option, index) => (option.textContent = labels[index]));

    expect(select.value).toBe('United Kingdom');
    expect(Array.from(select.options, (option) => option.value)).toEqual([
      'United Kingdom',
      'Ireland',
      'France',
      'Germany',
      'Spain',
    ]);
    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.form.controls.country.value).toBe('Ireland');
  });

  it('renders the order rail with basket items and order total', () => {
    const fixture = TestBed.createComponent(DeliveryPage);
    fixture.detectChanges();

    const railItems = fixture.nativeElement.querySelectorAll('.rail-item');
    expect(railItems.length).toBe(2);

    expect(railItems[0].textContent).toContain('Cushion');
    expect(railItems[0].textContent).toContain('Qty 2');
    expect(railItems[0].textContent).toContain('50.00');

    expect(railItems[1].textContent).toContain('Throw');
    expect(railItems[1].textContent).toContain('Qty 1');
    expect(railItems[1].textContent).toContain('60.00');

    const subtotalRow = fixture.nativeElement.querySelectorAll('.rail-row')[0];
    expect(subtotalRow.textContent).toContain('Subtotal');
    expect(subtotalRow.textContent).toContain('110.00');

    const totalSection = fixture.nativeElement.querySelector('.rail-total');
    expect(totalSection.textContent).toContain('Total');
    expect(totalSection.textContent).toContain('114.99');
  });
});
