import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { CheckoutFacade } from '../../data-access/checkout.facade';
import { type CheckoutPaymentToken, type DeliveryAddress } from '../../models/checkout.models';
import { PaymentPage } from './payment-page';
describe('PaymentPage', () => {
  const facade = {
    delivery: signal<DeliveryAddress | null>({
      name: 'Alex Morgan',
      email: 'alex@example.test',
      address: '4 Market Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'United Kingdom',
    }),
    paymentToken: signal<CheckoutPaymentToken | null>(null),
    setPaymentToken: vi.fn(),
    clearPaymentToken: vi.fn(),
  };

  beforeEach(async () => {
    facade.paymentToken.set(null);
    facade.setPaymentToken.mockReset();
    facade.clearPaymentToken.mockReset();
    await TestBed.configureTestingModule({
      imports: [PaymentPage],
      providers: [provideRouter([]), { provide: CheckoutFacade, useValue: facade }],
    }).compileComponents();
  });

  it('does not tokenize invalid card data', () => {
    const f = TestBed.createComponent(PaymentPage);
    f.detectChanges();
    f.componentInstance.continue();
    f.detectChanges();

    expect(facade.setPaymentToken).not.toHaveBeenCalled();
    expect(f.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Check the highlighted payment details',
    );
    expect(f.nativeElement.textContent).toContain('Enter expiry as MM/YY');
  });

  it('creates only a safe token and navigates to review for valid details', () => {
    const fixture = TestBed.createComponent(PaymentPage);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.componentInstance.form.setValue({
      name: 'Alex Morgan',
      card: '4444 4444 4444 4444',
      expiry: '12/29',
      cvv: '123',
    });

    fixture.componentInstance.continue();

    expect(facade.setPaymentToken).toHaveBeenCalledWith({
      tokenId: expect.stringMatching(/^tok_/),
      brand: 'Visa',
      last4: '4444',
    });
    expect(JSON.stringify(facade.setPaymentToken.mock.calls)).not.toContain('123');
    expect(navigate).toHaveBeenCalledWith('/checkout/review');
  });

  it('reuses a safe payment token when returning from review', () => {
    facade.paymentToken.set({ tokenId: 'tok_saved', brand: 'Visa', last4: '4242' });
    const fixture = TestBed.createComponent(PaymentPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Visa ending in 4242');
    expect(fixture.nativeElement.querySelector('a[href="/checkout/delivery"]')).toBeTruthy();
  });
});
