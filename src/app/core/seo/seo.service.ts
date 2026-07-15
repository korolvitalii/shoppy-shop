import { DOCUMENT } from '@angular/common';
import { inject, Injectable, LOCALE_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import {
  type AppLocale,
  getDefaultLocale,
  getLocaleDefinition,
  supportedLocales,
} from '../locale/locale.config';
import { type SeoPageDefinition } from './seo.models';

export const SITE_ORIGIN = 'https://zeta.vercel.app';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/social-preview.svg`;

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly locale = inject(LOCALE_ID);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  beginNavigation(): void {
    this.apply({
      title: 'ShoppyShop',
      description: $localize`:@@seoCustomerAreaDescription:ShoppyShop customer area`,
      path: '/products',
      indexable: false,
    });
  }

  apply(page: SeoPageDefinition): void {
    const title = page.title.includes('ShoppyShop') ? page.title : `${page.title} | ShoppyShop`;
    const canonical = this.localizedUrl(page.path, this.currentLocale);
    const image = page.image ?? DEFAULT_IMAGE;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({
      name: 'robots',
      content: page.indexable ? 'index,follow' : 'noindex,follow',
    });
    this.meta.updateTag({ property: 'og:site_name', content: 'ShoppyShop' });
    this.meta.updateTag({ property: 'og:type', content: page.type ?? 'website' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: page.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    this.setLink('canonical', canonical);
    this.removeAlternateLinks();
    if (page.indexable) {
      for (const locale of supportedLocales) {
        this.setAlternate(locale.hreflang, this.localizedUrl(page.path, locale));
      }
      this.setAlternate('x-default', this.localizedUrl(page.path, getDefaultLocale()));
    }
    this.setStructuredData(page.structuredData);
  }

  productStructuredData(product: {
    name: string;
    description: string;
    imageUrl: string;
    brand: string;
    groupId: string;
    id: string;
    price: number;
    salePrice: number | null;
    inStock: boolean;
  }): Record<string, unknown> {
    const path = `/products/${product.groupId}/${product.id}`;
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Product',
          name: product.name,
          description: product.description,
          image: [product.imageUrl],
          sku: product.id,
          brand: { '@type': 'Brand', name: product.brand },
          offers: {
            '@type': 'Offer',
            url: this.localizedUrl(path, this.currentLocale),
            priceCurrency: 'GBP',
            price: (product.salePrice ?? product.price).toFixed(2),
            availability: product.inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          },
        },
        this.breadcrumbStructuredData([
          { name: $localize`:@@products:Products`, path: '/products' },
          { name: product.groupId, path: `/products/${product.groupId}` },
          { name: product.name, path },
        ]),
      ],
    };
  }

  breadcrumbStructuredData(
    items: readonly { name: string; path: string }[],
  ): Record<string, unknown> {
    return {
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: this.localizedUrl(item.path, this.currentLocale),
      })),
    };
  }

  private get currentLocale(): AppLocale {
    return getLocaleDefinition(this.locale);
  }

  private localizedUrl(path: string, locale: AppLocale): string {
    return `${SITE_ORIGIN}/${locale.path}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private setLink(rel: string, href: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!link) {
      link = this.document.createElement('link');
      link.rel = rel;
      this.document.head.appendChild(link);
    }
    link.href = href;
  }

  private setAlternate(hreflang: string, href: string): void {
    const link = this.document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = hreflang;
    link.href = href;
    link.setAttribute('data-seo', 'alternate');
    this.document.head.appendChild(link);
  }

  private removeAlternateLinks(): void {
    this.document.head
      .querySelectorAll('link[data-seo="alternate"]')
      .forEach((element) => element.remove());
  }

  private setStructuredData(data?: SeoPageDefinition['structuredData']): void {
    this.document.getElementById('seo-structured-data')?.remove();
    if (!data) return;
    const script = this.document.createElement('script');
    script.id = 'seo-structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }
}
