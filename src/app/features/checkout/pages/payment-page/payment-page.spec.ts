import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CheckoutFacade } from '../../data-access/checkout.facade';
import { PaymentPage } from './payment-page';
describe('PaymentPage', () => {
  const facade = { setPaymentToken: vi.fn() };
  beforeEach(async () =>
    TestBed.configureTestingModule({
      imports: [PaymentPage],
      providers: [provideRouter([]), { provide: CheckoutFacade, useValue: facade }],
    }).compileComponents(),
  );
  it('does not tokenize invalid card data', () => {
    const f = TestBed.createComponent(PaymentPage);
    f.detectChanges();
    f.componentInstance.continue();
    expect(facade.setPaymentToken).not.toHaveBeenCalled();
  });
});
