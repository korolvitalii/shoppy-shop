import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { type ProductGroup } from '../../models/product-group';
import { CatalogueFilters } from './catalogue-filters';

const categories: readonly ProductGroup[] = [
  {
    id: 'beauty',
    name: 'Beauty & fragrance',
    description: 'd',
    imageUrl: '/g.jpg',
    itemCount: 29,
    badge: null,
  },
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'd',
    imageUrl: '/g.jpg',
    itemCount: 26,
    badge: null,
  },
];

const baseQuery = {
  search: '',
  sort: 'featured' as const,
  price: 'all' as const,
  inStock: false,
  isNew: false,
  giftWrappable: false,
};

describe('CatalogueFilters', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogueFilters],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('lists categories with their counts and marks the active one', () => {
    const fixture = TestBed.createComponent(CatalogueFilters);
    fixture.componentRef.setInput('categories', categories);
    fixture.componentRef.setInput('activeGroupId', 'beauty');
    fixture.componentRef.setInput('query', baseQuery);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Beauty & fragrance');
    expect(element.textContent).toContain('29');
    expect(element.querySelector('a[href="/products/beauty"]')?.classList).toContain('active');
    expect(element.querySelector('a[href="/products/search"]')?.classList).not.toContain('active');
  });

  it('emits a price change when a segment is clicked', () => {
    const fixture = TestBed.createComponent(CatalogueFilters);
    fixture.componentRef.setInput('categories', categories);
    fixture.componentRef.setInput('activeGroupId', 'all');
    fixture.componentRef.setInput('query', baseQuery);
    fixture.detectChanges();

    const emitted: string[] = [];
    fixture.componentInstance.priceChange.subscribe((value) => emitted.push(value));

    const inputs = (fixture.nativeElement as HTMLElement).querySelectorAll('.segmented input');
    inputs[1].dispatchEvent(new Event('change'));

    expect(emitted).toEqual(['0-50']);
  });

  it('emits the toggled value for each availability checkbox', () => {
    const fixture = TestBed.createComponent(CatalogueFilters);
    fixture.componentRef.setInput('categories', categories);
    fixture.componentRef.setInput('activeGroupId', 'all');
    fixture.componentRef.setInput('query', baseQuery);
    fixture.detectChanges();

    const inStock: boolean[] = [];
    fixture.componentInstance.inStockChange.subscribe((value) => inStock.push(value));

    const checkbox = (fixture.nativeElement as HTMLElement).querySelector(
      '.checkbox input',
    ) as HTMLInputElement;
    checkbox.dispatchEvent(new Event('change'));

    expect(inStock).toEqual([true]);
  });

  it('emits filtersReset when the reset button is clicked', () => {
    const fixture = TestBed.createComponent(CatalogueFilters);
    fixture.componentRef.setInput('categories', categories);
    fixture.componentRef.setInput('activeGroupId', 'all');
    fixture.componentRef.setInput('query', baseQuery);
    fixture.detectChanges();

    let resetCount = 0;
    fixture.componentInstance.filtersReset.subscribe(() => resetCount++);

    (
      (fixture.nativeElement as HTMLElement).querySelector('.reset-filters') as HTMLButtonElement
    ).click();

    expect(resetCount).toBe(1);
  });
});
