import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { type Product } from '../../../../shared/domain/product';
import { FavoritesService } from '../../data-access/favorites.service';
import { FavoritesPage } from './favorites-page';

describe('FavoritesPage', () => {
  const favorites = {
    count: signal(0),
    products: signal<readonly Product[]>([]),
    clear: vi.fn(),
    toggle: vi.fn(),
  };

  beforeEach(async () => {
    favorites.count.set(0);
    favorites.products.set([]);
    favorites.clear.mockReset();
    favorites.toggle.mockReset();
    await TestBed.configureTestingModule({
      imports: [FavoritesPage],
      providers: [provideRouter([]), { provide: FavoritesService, useValue: favorites }],
    }).compileComponents();
  });

  it.each([
    [1, '1 product saved'],
    [2, '2 products saved'],
  ])('shows the exact saved-product count for %i products', (count, text) => {
    favorites.count.set(count);
    const fixture = TestBed.createComponent(FavoritesPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.page-header h1 + p')?.textContent?.trim()).toBe(text);
  });
});
