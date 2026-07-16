import { DOCUMENT } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { supportedLocales } from '../locale/locale.config';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let document: Document;
  let service: SeoService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'en-GB' }] });
    document = TestBed.inject(DOCUMENT);
    service = TestBed.inject(SeoService);
  });

  afterEach(() => {
    document.head.querySelector('link[rel="canonical"]')?.remove();
    document.head.querySelectorAll('link[data-seo="alternate"]').forEach((link) => link.remove());
    document.getElementById('seo-structured-data')?.remove();
  });

  it('replaces route metadata without duplicating SEO elements', () => {
    service.apply({
      title: 'First page',
      description: 'First description',
      path: '/products/beauty',
      indexable: true,
      structuredData: { '@context': 'https://schema.org', '@type': 'CollectionPage' },
    });
    service.apply({
      title: 'Second page',
      description: 'Second description',
      path: '/products/electronics',
      indexable: true,
      structuredData: { '@context': 'https://schema.org', '@type': 'CollectionPage' },
    });

    expect(document.title).toBe('Second page | ShoppyShop');
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('link[data-seo="alternate"]')).toHaveLength(
      supportedLocales.length + 1,
    );
    expect(document.head.querySelectorAll('#seo-structured-data')).toHaveLength(1);
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://zeta.vercel.app/en/products/electronics',
    );
  });

  it('creates truthful product offer data for sale and stock status', () => {
    const data = service.productStructuredData({
      id: 'lamp-1',
      groupId: 'home',
      name: 'Desk lamp',
      brand: 'Glow',
      description: 'A compact desk lamp.',
      imageUrl: '/lamp.jpg',
      price: 50,
      salePrice: 40,
      inStock: false,
    });
    const serialized = JSON.stringify(data);

    expect(serialized).toContain('"price":"40.00"');
    expect(serialized).toContain('https://schema.org/OutOfStock');
    expect(serialized).toContain('"@type":"BreadcrumbList"');
  });
});
