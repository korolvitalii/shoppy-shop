import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ConfirmationService } from '../../../../core/confirmation/confirmation.service';
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
    clear: vi.fn(),
  };
  const confirmation = { confirm: vi.fn() };

  beforeEach(async () => {
    items.set([]);
    basket.itemCount.set(0);
    basket.subtotal.set(0);
    basket.updateQuantity.mockReset();
    basket.remove.mockReset();
    basket.clear.mockReset();
    confirmation.confirm.mockReset();
    confirmation.confirm.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [BasketPage],
      providers: [
        provideRouter([]),
        { provide: BasketService, useValue: basket },
        { provide: ConfirmationService, useValue: confirmation },
      ],
    }).compileComponents();
  });

  it('shows a useful empty state', () => {
    const fixture = TestBed.createComponent(BasketPage);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Your basket is empty');
    expect(fixture.nativeElement.querySelector('a[href="/products"]')).toBeTruthy();
  });

  it('renders items, totals, and confirms removal', async () => {
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
    await fixture.whenStable();

    expect(confirmation.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Remove Studio headphones?', tone: 'danger' }),
    );
    expect(basket.remove).toHaveBeenCalledWith('headphones');
  });

  it('keeps an item when removal is cancelled', async () => {
    confirmation.confirm.mockResolvedValue(false);
    items.set([
      {
        productId: 'headphones',
        groupId: 'electronics',
        name: 'Studio headphones',
        imageUrl: '/images/headphones.jpg',
        unitPrice: 199,
        quantity: 1,
      },
    ]);
    basket.itemCount.set(1);
    const fixture = TestBed.createComponent(BasketPage);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[aria-label^="Decrease"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(basket.remove).not.toHaveBeenCalled();
    expect(basket.updateQuantity).not.toHaveBeenCalled();
  });

  it('confirms before clearing the complete basket', async () => {
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
    const fixture = TestBed.createComponent(BasketPage);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.clear') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(confirmation.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Clear your basket?' }),
    );
    expect(basket.clear).toHaveBeenCalledOnce();
  });
});
