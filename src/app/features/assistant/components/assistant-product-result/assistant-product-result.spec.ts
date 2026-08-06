import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BasketService } from '../../../basket/data-access/basket.service';
import { type Product } from '../../../catalogue/models/product';
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
};

describe('AssistantProductResult', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantProductResult],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  it('adds the product to the basket when "Add to basket" is clicked', () => {
    const fixture = TestBed.createComponent(AssistantProductResult);
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
    const basket = TestBed.inject(BasketService);

    (fixture.nativeElement.querySelector('.add-to-basket') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(basket.items()).toEqual([
      expect.objectContaining({ productId: 'jacket-1', quantity: 1 }),
    ]);
    expect(
      (fixture.nativeElement.querySelector('.add-to-basket') as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});
