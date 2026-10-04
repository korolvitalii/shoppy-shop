import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, type Observable, of, throwError } from 'rxjs';

import { normalizeError } from '../../../core/errors/app-error';
import { SKIP_ERROR_NOTIFICATION_STATUSES } from '../../../core/errors/error-context';
import { PrerenderSnapshot } from '../../../core/prerender/prerender-snapshot';
import { type Product } from '../../../shared/domain/product';
import catalogue from '../data/catalogue.json';
import {
  type ProductPage,
  type ProductPageRequest,
  type ProductSearchQuery,
} from '../models/product';
import { type CatalogueRequestOptions, requestContext } from './request-context';

const DEFAULT_PAGE_SIZE = 24;

@Injectable()
export abstract class ProductsRepository {
  abstract search(
    groupId: string,
    query: ProductSearchQuery,
    page?: ProductPageRequest,
    options?: CatalogueRequestOptions,
  ): Observable<ProductPage>;
  abstract getById(groupId: string, productId: string): Observable<Product | null>;
}

@Injectable()
export class ApiProductsRepository implements ProductsRepository {
  private readonly http = inject(HttpClient);
  private readonly snapshot = inject(PrerenderSnapshot);

  search(
    groupId: string,
    query: ProductSearchQuery,
    page?: ProductPageRequest,
    options?: CatalogueRequestOptions,
  ): Observable<ProductPage> {
    const request = (revalidating: boolean) =>
      this.request(groupId, query, page, options?.silent || revalidating);
    // Only a first page can have been prerendered; a later one follows a cursor only the API issues.
    return page?.cursor
      ? request(false)
      : this.snapshot.revalidate(searchSnapshotKey(groupId, query, page?.limit), request);
  }

  getById(groupId: string, productId: string): Observable<Product | null> {
    return this.snapshot.revalidate(productSnapshotKey(groupId, productId), (silent) =>
      this.http
        .get<Product | null>(`/api/product-groups/${groupId}/products/${productId}`, {
          context: requestContext(silent).set(SKIP_ERROR_NOTIFICATION_STATUSES, [404]),
        })
        .pipe(
          // A missing product is a domain result, including when a live answer replaces a
          // prerendered product. Convert it before revalidation falls back on request errors.
          catchError((error: unknown) =>
            normalizeError(error).status === 404 ? of(null) : throwError(() => error),
          ),
        ),
    );
  }

  private request(
    groupId: string,
    query: ProductSearchQuery,
    page: ProductPageRequest | undefined,
    silent: boolean,
  ): Observable<ProductPage> {
    let params = new HttpParams()
      .set('search', query.search)
      .set('sort', query.sort)
      .set('price', query.price)
      .set('inStock', query.inStock)
      .set('isNew', query.isNew)
      .set('giftWrappable', query.giftWrappable);
    if (page?.cursor) {
      params = params.set('cursor', page.cursor);
    }
    if (page?.limit) {
      params = params.set('limit', page.limit);
    }
    const endpoint =
      groupId === 'all' ? '/api/products' : `/api/product-groups/${groupId}/products`;
    return this.http.get<ProductPage>(endpoint, { params, context: requestContext(silent) });
  }
}

@Injectable()
export class StaticProductsRepository implements ProductsRepository {
  private readonly snapshot = inject(PrerenderSnapshot);

  search(
    groupId: string,
    query: ProductSearchQuery,
    page?: ProductPageRequest,
  ): Observable<ProductPage> {
    const effectivePrice = (product: Product) => product.salePrice ?? product.price;
    const search = query.search.toLowerCase();
    const products = catalogue.products
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
    const product =
      catalogue.products.find(
        (candidate) => candidate.groupId === groupId && candidate.id === productId,
      ) ?? null;
    this.snapshot.record(productSnapshotKey(groupId, productId), product);
    return of(product);
  }
}

// Built field by field rather than with JSON.stringify(query), so the server and the browser derive
// the same key however each one happened to construct the query object.
function searchSnapshotKey(groupId: string, query: ProductSearchQuery, limit?: number): string {
  return `products:${groupId}:${JSON.stringify([
    query.search,
    query.sort,
    query.price,
    query.inStock,
    query.isNew,
    query.giftWrappable,
    limit ?? null,
  ])}`;
}

function productSnapshotKey(groupId: string, productId: string): string {
  return `product:${groupId}:${productId}`;
}

function decodeOffset(cursor: string | null | undefined): number {
  const offset = Number(cursor);
  return cursor && Number.isInteger(offset) && offset > 0 ? offset : 0;
}

function compareOrdinal(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
