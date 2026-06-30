import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

import { BasketService } from '../../../basket/data-access/basket.service';
import { ProductsRepository } from '../../data-access/products.repository';
import { type Product } from '../../models/product';
import { ProductDetailsPage } from './product-details-page';

describe('ProductDetailsPage', () => {
  const params = new BehaviorSubject(
    convertToParamMap({ groupId: 'electronics', productId: 'headphones' }),
  );
  const repository = { search: vi.fn(), getById: vi.fn() };
  const basket = { add: vi.fn() };
  let response: Subject<Product | null>;

  const product: Product = {
    id: 'headphones',
    groupId: 'electronics',
    name: 'Studio headphones',
    brand: 'Sonic',
    description: 'Wireless noise-cancelling headphones for focused listening.',
    imageUrl: '/images/headphones.jpg',
    price: 249,
    salePrice: 199,
    inStock: true,
  };

  beforeEach(async () => {
    response = new Subject<Product | null>();
    repository.getById.mockReset();
    repository.getById.mockReturnValue(response);
    basket.add.mockReset();

    await TestBed.configureTestingModule({
      imports: [ProductDetailsPage],
      providers: [
        provideRouter([]),
        { provide: ProductsRepository, useValue: repository },
        { provide: BasketService, useValue: basket },
        { provide: ActivatedRoute, useValue: { paramMap: params } },
      ],
    }).compileComponents();
  });

  it('loads a product from both route identifiers', () => {
    const fixture = TestBed.createComponent(ProductDetailsPage);
    fixture.detectChanges();

    expect(repository.getById).toHaveBeenCalledWith('electronics', 'headphones');
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Loading product',
    );
  });

  it('renders product information, sale pricing, and stock status', () => {
    const fixture = TestBed.createComponent(ProductDetailsPage);
    fixture.detectChanges();
    response.next(product);
    response.complete();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Studio headphones');
    expect(element.textContent).toContain('£199.00');
    expect(element.textContent).toContain('Save £50.00');
    expect(element.textContent).toContain('In stock');
    expect(element.querySelector('img')?.alt).toBe('Studio headphones');
  });

  it('changes quantity and adds the selected amount to the basket', () => {
    const fixture = TestBed.createComponent(ProductDetailsPage);
    fixture.detectChanges();
    response.next(product);
    response.complete();
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector('[aria-label="Increase quantity"]') as HTMLButtonElement
    ).click();
    (
      fixture.nativeElement.querySelector('[data-testid="add-to-basket"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(basket.add).toHaveBeenCalledWith(product, 2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Added to basket');
  });

  it('shows a not-found state for an unknown product', () => {
    const fixture = TestBed.createComponent(ProductDetailsPage);
    fixture.detectChanges();
    response.next(null);
    response.complete();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Product not found');
    expect(fixture.nativeElement.querySelector('a[href="/products"]')).toBeTruthy();
  });
});
