import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CheckoutFacade } from '../../data-access/checkout.facade';
import { type CheckoutPaymentToken, type DeliveryAddress } from '../../models/checkout.models';
import { DeliveryPage } from './delivery-page';
describe('DeliveryPage', () => {
  const facade = {
    delivery: signal<DeliveryAddress | null>(null),
    paymentToken: signal<CheckoutPaymentToken | null>(null),
    setDelivery: vi.fn(),
  };

  beforeEach(async () => {
    facade.delivery.set(null);
    facade.paymentToken.set(null);
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
    expect(fixture.nativeElement.querySelector('a[href="/basket"]')).toBeTruthy();
  });
});
