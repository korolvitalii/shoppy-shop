import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
  });
});
