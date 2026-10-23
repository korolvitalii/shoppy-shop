import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import catalogue from '../data/catalogue.json';
import names from '../data/catalogue.names.json';
import { BundledCatalogueDisplay } from './bundled-catalogue-display';

const display = (locale: string) => {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: locale }] });
  return TestBed.inject(BundledCatalogueDisplay);
};

describe('BundledCatalogueDisplay', () => {
  it('names every seeded product and category in Polish', () => {
    const polish = display('pl');
    for (const product of catalogue.products) {
      const name = names.products.find((entry) => entry.id === product.id)!.name;
      expect(polish.productName(product.id, product.name)).toBe(name.pl);
    }
    expect(polish.categoryName('beauty')).toBe('Uroda i zapachy');
    expect(polish.categories.map((category) => category.id)).toEqual(
      catalogue.groups.map((group) => group.id),
    );
  });

  it('restores the English name of a basket line saved on the Polish site', () => {
    const english = display('en-GB');
    const [polishName, englishName] = ['Skórzana kurtka motocyklowa', 'Leather Biker Jacket'];
    expect(english.productName('fashion-1', polishName)).toBe(englishName);
    expect(english.categoryName('beauty')).toBe('Beauty & fragrance');
  });

  it('keeps names and categories it cannot vouch for', () => {
    const polish = display('pl');
    expect(polish.productName('fashion-1', 'Renamed by an admin')).toBe('Renamed by an admin');
    expect(polish.productName('removed-product', 'Original purchase name')).toBe(
      'Original purchase name',
    );
    expect(polish.categoryName('new-category')).toBe('new-category');
  });

  it('renames basket lines without changing their identity or quantities', () => {
    const line = {
      productId: 'fashion-1',
      groupId: 'fashion',
      name: 'Leather Biker Jacket',
      quantity: 2,
    };
    expect(display('pl').withProductNames([line])).toEqual([
      { ...line, name: 'Skórzana kurtka motocyklowa' },
    ]);
  });
});
