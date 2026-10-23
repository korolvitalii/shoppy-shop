import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, type Observable, of, throwError } from 'rxjs';

import { normalizeError } from '../../../core/errors/app-error';
import { SKIP_ERROR_NOTIFICATION_STATUSES } from '../../../core/errors/error-context';
import { PrerenderSnapshot } from '../../../core/prerender/prerender-snapshot';
import { type Product } from '../../../shared/domain/product';
import {
  type ProductPage,
  type ProductPageRequest,
  type ProductSearchQuery,
} from '../models/product';
import { type CatalogueRequestOptions, requestContext } from './request-context';

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

/** The API answers in the storefront's language (`requestContext` marks each request). */
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

// Built field by field rather than with JSON.stringify(query), so the server and the browser derive
// the same key however each one happened to construct the query object.
export function searchSnapshotKey(
  groupId: string,
  query: ProductSearchQuery,
  limit?: number,
): string {
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

export function productSnapshotKey(groupId: string, productId: string): string {
  return `product:${groupId}:${productId}`;
}
