import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { CheckoutFacade } from '../../data-access/checkout.facade';
import { ReviewPage } from './review-page';
describe('ReviewPage', () => {
  it('renders the final total before submission', async () => {
    const facade = {
      items: () => [],
      itemCount: () => 0,
      subtotal: () => 10,
      deliveryCharge: () => 4.99,
      total: () => 14.99,
      delivery: () => ({ name: 'A' }),
      paymentToken: signal({ tokenId: 'tok_1', brand: 'Visa', last4: '4242' }),
      createOrder: vi.fn(() => of({ id: 'ORD-1' })),
      clearBasket: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [ReviewPage],
      providers: [provideRouter([]), { provide: CheckoutFacade, useValue: facade }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ReviewPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('£14.99');
    expect(fixture.nativeElement.querySelector('a[href="/checkout/payment"]')).toBeTruthy();
  });

  it('clears the basket and opens confirmation after placing an order', async () => {
    const facade = {
      items: () => [],
      itemCount: () => 0,
      subtotal: () => 10,
      deliveryCharge: () => 4.99,
      total: () => 14.99,
      delivery: () => ({ name: 'A' }),
      paymentToken: signal({ tokenId: 'tok_1', brand: 'Visa', last4: '4242' }),
      createOrder: vi.fn(() => of({ id: 'ORD-00042' })),
      clearBasket: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [ReviewPage],
      providers: [provideRouter([]), { provide: CheckoutFacade, useValue: facade }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ReviewPage);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    fixture.componentInstance.submit();

    expect(facade.clearBasket).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/orders/ORD-00042/confirmation', { replaceUrl: true });
  });

  it('shows the shipping address and payment method in the info cards', async () => {
    const facade = {
      items: () => [],
      itemCount: () => 0,
      subtotal: () => 10,
      deliveryCharge: () => 4.99,
      total: () => 14.99,
      delivery: () => ({
        name: 'Alex Morgan',
        address: '4 Market Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'United Kingdom',
      }),
      paymentToken: signal({ tokenId: 'tok_1', brand: 'Visa', last4: '4242' }),
      createOrder: vi.fn(() => of({ id: 'ORD-1' })),
      clearBasket: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [ReviewPage],
      providers: [provideRouter([]), { provide: CheckoutFacade, useValue: facade }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ReviewPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Alex Morgan');
    expect(fixture.nativeElement.textContent).toContain('4 Market Street');
    expect(fixture.nativeElement.textContent).toContain('Visa ending 4242');
  });
});
