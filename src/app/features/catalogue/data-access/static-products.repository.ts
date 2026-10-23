import { inject, Injectable, LOCALE_ID } from '@angular/core';
import { type Observable, of } from 'rxjs';

import { getLocaleDefinition } from '../../../core/locale/locale.config';
import { PrerenderSnapshot } from '../../../core/prerender/prerender-snapshot';
import { type Product } from '../../../shared/domain/product';
import catalogue from '../data/catalogue.json';
import {
  type ProductPage,
  type ProductPageRequest,
  type ProductSearchQuery,
} from '../models/product';
import { localizedProduct } from './catalogue-translations';
import {
  productSnapshotKey,
  type ProductsRepository,
  searchSnapshotKey,
} from './products.repository';

// The API's default page size.
const DEFAULT_PAGE_SIZE = 24;

/**
 * Prerendering's catalogue source (bound in `app.config.server.ts`). It lives apart from the API
 * repository so the browser bundle never includes it, the catalogue or its translations.
 */
@Injectable()
export class StaticProductsRepository implements ProductsRepository {
  private readonly snapshot = inject(PrerenderSnapshot);
  private readonly locale = getLocaleDefinition(inject(LOCALE_ID)).path;

  search(
    groupId: string,
    query: ProductSearchQuery,
    page?: ProductPageRequest,
  ): Observable<ProductPage> {
    const effectivePrice = (product: Product) => product.salePrice ?? product.price;
    const search = query.search.toLowerCase();
    const products = catalogue.products
      .map((product) => localizedProduct(product, this.locale))
      .filter(
        (product) =>
          (groupId === 'all' || product.groupId === groupId) &&
          `${product.name} ${product.brand}`.toLowerCase().includes(search),
      )
      .filter((product) => {
        const amount = effectivePrice(product);
        if (query.price === '0-50') return amount < 50;
        if (query.price === '50-200') return amount >= 50 && amount < 200;
        if (query.price === '200+') return amount >= 200;
        return true;
      })
      .filter((product) => !query.inStock || product.inStock)
      .filter((product) => !query.isNew || product.isNew)
      .filter((product) => !query.giftWrappable || product.giftWrappable);
    const sorted = [...products].sort((left, right) => {
      if (query.sort === 'price-asc') return effectivePrice(left) - effectivePrice(right);
      if (query.sort === 'price-desc') return effectivePrice(right) - effectivePrice(left);
      if (query.sort === 'name') return left.name.localeCompare(right.name);
      // The API's featured order: group, then id compared as a string, so beauty-10 comes before
      // beauty-2. A prerendered listing in any other order visibly reshuffles once the browser
      // revalidates it against the API.
      return compareOrdinal(left.groupId, right.groupId) || compareOrdinal(left.id, right.id);
    });

    // This is the prerender-time source, backed by a bundled 90-product catalogue rather than the
    // database, so its cursor is just an offset into the sorted array. It is deliberately not
    // interchangeable with the API's keyset cursor — nothing carries one across, because a page
    // switching from this repository to the API one starts a fresh query.
    const start = decodeOffset(page?.cursor);
    const limit = page?.limit ?? DEFAULT_PAGE_SIZE;
    const items = sorted.slice(start, start + limit);
    const nextOffset = start + items.length;
    const result: ProductPage = {
      items,
      nextCursor: nextOffset < sorted.length ? String(nextOffset) : null,
      totalCount: page?.cursor ? null : sorted.length,
    };

    if (!page?.cursor) {
      // The snapshot goes without its cursor: an offset means nothing to the API, so the browser
      // offers "Load more" once the live first page brings the API's own cursor.
      this.snapshot.record(searchSnapshotKey(groupId, query, page?.limit), {
        ...result,
        nextCursor: null,
      });
    }
    return of(result);
  }

  getById(groupId: string, productId: string): Observable<Product | null> {
    const found = catalogue.products.find(
      (candidate) => candidate.groupId === groupId && candidate.id === productId,
    );
    const product = found ? localizedProduct(found, this.locale) : null;
    this.snapshot.record(productSnapshotKey(groupId, productId), product);
    return of(product);
  }
}

function decodeOffset(cursor: string | null | undefined): number {
  const offset = Number(cursor);
  return cursor && Number.isInteger(offset) && offset > 0 ? offset : 0;
}

function compareOrdinal(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
