import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { type Product } from '../../domain/product';
import { ProductCard } from './product-card';

const product: Product = {
  id: 'beauty-1',
  groupId: 'beauty',
  name: 'Test perfume',
  brand: 'Test brand',
  description: 'A fragrance.',
  imageUrl: '/perfume.jpg',
  price: 100,
  salePrice: 80,
  inStock: true,
  isNew: false,
  giftWrappable: true,
};

describe('ProductCard image loading', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [ProductCard], providers: [provideRouter([])] }),
  );

  it('keeps supporting images lazy with normal fetch priority', () => {
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
    const image = (fixture.nativeElement as HTMLElement).querySelector('img')!;
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.getAttribute('fetchpriority')).toBe('auto');
    expect(image.alt).toBe(product.name);
  });

  it('renders eager and high priority when requested by a page', () => {
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', product);
    fixture.componentRef.setInput('imageLoading', 'eager');
    fixture.componentRef.setInput('imagePriority', 'high');
    fixture.detectChanges();
    const image = (fixture.nativeElement as HTMLElement).querySelector('img')!;
    expect(image.getAttribute('loading')).toBe('eager');
    expect(image.getAttribute('fetchpriority')).toBe('high');
  });
});
