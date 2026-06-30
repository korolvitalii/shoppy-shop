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

  async function render(): Promise<ComponentRef<ProductGroupCard>> {
    await TestBed.configureTestingModule({
      imports: [ProductGroupCard],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProductGroupCard);
    fixture.componentRef.setInput('group', group);
    fixture.detectChanges();
    return fixture.componentRef;
  }

  it('renders a product group as a semantic article and link', async () => {
    const component = await render();
    const element = component.location.nativeElement as HTMLElement;

    expect(element.querySelector('article')).toBeTruthy();
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/products/gifts');
    expect(element.querySelector('h2')?.textContent).toContain('Gifts');
    expect(element.textContent).toContain('1 product');
    expect(element.querySelector('img')?.getAttribute('loading')).toBe('lazy');
  });
});
