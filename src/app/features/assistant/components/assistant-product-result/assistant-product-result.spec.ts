import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { type Product } from '../../../../shared/domain/product';
import { AssistantProductResult } from './assistant-product-result';

const product: Product = {
  id: 'jacket-1',
  groupId: 'outerwear',
  name: 'Rainguard Jacket',
  brand: 'Trailhead',
  description: 'A waterproof jacket.',
  imageUrl: '/jacket.jpg',
  price: 45,
  salePrice: null,
  inStock: true,
  isNew: false,
  giftWrappable: false,
};

describe('AssistantProductResult', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantProductResult],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function render(inputs: { favorite?: boolean; added?: boolean } = {}) {
    const fixture = TestBed.createComponent(AssistantProductResult);
    fixture.componentRef.setInput('product', product);
    if (inputs.favorite !== undefined) fixture.componentRef.setInput('favorite', inputs.favorite);
    if (inputs.added !== undefined) fixture.componentRef.setInput('added', inputs.added);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      favoriteButton: element.querySelector('.favorite-button') as HTMLButtonElement,
      addButton: element.querySelector('.add-to-basket') as HTMLButtonElement,
    };
  }

  it('reports the basket intent without changing anything itself', () => {
    const { fixture, addButton } = render();
    const basketAdd = vi.fn();
    fixture.componentInstance.basketAdd.subscribe(basketAdd);

    addButton.click();

    expect(basketAdd).toHaveBeenCalledTimes(1);
    expect(addButton.disabled).toBe(false);
  });

  it('shows the confirmation the container reports', () => {
    const { addButton } = render({ added: true });

    expect(addButton.disabled).toBe(true);
    expect(addButton.textContent).toContain('Added');
  });

  it('reports the favorite intent', () => {
    const { fixture, favoriteButton } = render();
    const favoriteToggle = vi.fn();
    fixture.componentInstance.favoriteToggle.subscribe(favoriteToggle);

    favoriteButton.click();

    expect(favoriteToggle).toHaveBeenCalledTimes(1);
  });

  it('labels the favorite button with the product and its saved state', () => {
    const { fixture, favoriteButton } = render();

    expect(favoriteButton.getAttribute('aria-label')).toBe('Add Rainguard Jacket to favourites');
    expect(favoriteButton.getAttribute('aria-pressed')).toBe('false');

    fixture.componentRef.setInput('favorite', true);
    fixture.detectChanges();

    expect(favoriteButton.getAttribute('aria-label')).toBe(
      'Remove Rainguard Jacket from favourites',
    );
    expect(favoriteButton.getAttribute('aria-pressed')).toBe('true');
  });
});
