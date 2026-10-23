import { type ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { type ProductGroup } from '../../models/product-group';
import { ProductGroupCard } from './product-group-card';

describe('ProductGroupCard', () => {
  const group: ProductGroup = {
    id: 'gifts',
    name: 'Gifts',
    description: 'Thoughtful finds for memorable moments.',
    imageUrl: '/images/gifts.jpg',
    itemCount: 1,
    badge: 'Gift guide',
  };

  async function render(itemCount = 1): Promise<ComponentRef<ProductGroupCard>> {
    await TestBed.configureTestingModule({
      imports: [ProductGroupCard],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProductGroupCard);
    fixture.componentRef.setInput('group', { ...group, itemCount });
    fixture.detectChanges();
    return fixture.componentRef;
  }

  it('renders a product group as a semantic article and link', async () => {
    const component = await render();
    const element = component.location.nativeElement as HTMLElement;

    expect(element.querySelector('article')).toBeTruthy();
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/products/gifts');
    expect(element.querySelector('h2')?.textContent).toContain('Gifts');
    expect(element.querySelector('img')?.getAttribute('loading')).toBe('lazy');
  });

  it.each([
    [0, '0 products →'],
    [1, '1 product →'],
    [2, '2 products →'],
    [15, '15 products →'],
  ])('renders the exact product count for %i products', async (count, text) => {
    const component = await render(count);
    const element = component.location.nativeElement as HTMLElement;

    expect(element.querySelector('.card-meta')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      text,
    );
  });

  it('accepts the containing page image-loading priority', async () => {
    const component = await render();
    component.setInput('imageLoading', 'eager');
    component.setInput('imagePriority', 'high');
    component.changeDetectorRef.detectChanges();
    const image = (component.location.nativeElement as HTMLElement).querySelector('img')!;
    expect(image.getAttribute('loading')).toBe('eager');
    expect(image.getAttribute('fetchpriority')).toBe('high');
  });
});
