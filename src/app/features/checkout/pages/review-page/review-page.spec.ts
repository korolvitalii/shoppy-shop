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
});
