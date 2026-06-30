import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BasketService } from '../../data-access/basket.service';
import { type BasketItem } from '../../models/basket-item';
import { BasketPage } from './basket-page';

describe('BasketPage', () => {
  const items = signal<readonly BasketItem[]>([]);
  const basket = {
    items,
    itemCount: signal(0),
    subtotal: signal(0),
    updateQuantity: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    items.set([]);
    basket.itemCount.set(0);
    basket.subtotal.set(0);
    basket.updateQuantity.mockReset();
    basket.remove.mockReset();

    await TestBed.configureTestingModule({
      imports: [BasketPage],
      providers: [provideRouter([]), { provide: BasketService, useValue: basket }],
    }).compileComponents();
  });

  it('shows a useful empty state', () => {
    const fixture = TestBed.createComponent(BasketPage);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Your basket is empty');
    expect(fixture.nativeElement.querySelector('a[href="/products"]')).toBeTruthy();
  });

  it('renders items, totals, and delegates quantity changes', () => {
    items.set([
      {
        productId: 'headphones',
        groupId: 'electronics',
        name: 'Studio headphones',
        imageUrl: '/images/headphones.jpg',
        unitPrice: 199,
        quantity: 2,
      },
    ]);
    basket.itemCount.set(2);
    basket.subtotal.set(398);
    const fixture = TestBed.createComponent(BasketPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Studio headphones');
    expect(element.textContent).toContain('£398.00');

    (
      element.querySelector(
        '[aria-label="Increase Studio headphones quantity"]',
      ) as HTMLButtonElement
    ).click();
    expect(basket.updateQuantity).toHaveBeenCalledWith('headphones', 3);

    (element.querySelector('[aria-label="Remove Studio headphones"]') as HTMLButtonElement).click();
    expect(basket.remove).toHaveBeenCalledWith('headphones');
  });
});
