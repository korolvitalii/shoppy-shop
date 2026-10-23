import catalogue from '../data/catalogue.json';
import catalogueText from '../data/catalogue.translations.json';
import { localizedGroup, localizedProduct } from './catalogue-translations';

const polish = catalogueText.translations.find((text) => text.locale === 'pl')!;

describe('catalogue translations for prerendering', () => {
  it('translates the complete seed without changing identity or commerce fields', () => {
    for (const product of catalogue.products) {
      const text = polish.products.find((item) => item.id === product.id)!;
      expect(localizedProduct(product, 'pl')).toEqual({
        ...product,
        name: text.name,
        description: text.description,
      });
    }
    for (const group of catalogue.groups) {
      const text = polish.groups.find((item) => item.id === group.id)!;
      expect(localizedGroup(group, 'pl')).toEqual({
        ...group,
        name: text.name,
        description: text.description,
        badge: text.badge,
      });
    }
  });

  it('keeps source text that changed after it was translated, and the source language', () => {
    const edited = { ...catalogue.products[0], name: 'An admin changed this product' };
    expect(localizedProduct(edited, 'pl')).toBe(edited);
    expect(localizedProduct(catalogue.products[0], 'en')).toBe(catalogue.products[0]);
  });
});
