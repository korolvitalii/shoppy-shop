import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { type Observable, of } from 'rxjs';

import { type Product } from '../../../shared/domain/product';
import catalogue from '../data/catalogue.json';
import {
  type ProductPage,
  type ProductPageRequest,
  type ProductSearchQuery,
} from '../models/product';

const DEFAULT_PAGE_SIZE = 24;

@Injectable()
export abstract class ProductsRepository {
  abstract search(
    groupId: string,
    query: ProductSearchQuery,
    page?: ProductPageRequest,
  ): Observable<ProductPage>;
  abstract getById(groupId: string, productId: string): Observable<Product | null>;
}

@Injectable()
export class ApiProductsRepository implements ProductsRepository {
  private readonly http = inject(HttpClient);

  search(
    groupId: string,
    query: ProductSearchQuery,
    page?: ProductPageRequest,
  ): Observable<ProductPage> {
    let params = new HttpParams()
      .set('search', query.search)
      .set('sort', query.sort)
      .set('price', query.price);
    if (page?.cursor) {
      params = params.set('cursor', page.cursor);
    }
    if (page?.limit) {
      params = params.set('limit', page.limit);
    }
    const endpoint =
      groupId === 'all' ? '/api/products' : `/api/product-groups/${groupId}/products`;
    return this.http.get<ProductPage>(endpoint, { params });
  }

  getById(groupId: string, productId: string): Observable<Product | null> {
    return this.http.get<Product | null>(`/api/product-groups/${groupId}/products/${productId}`);
  }
}

@Injectable()
export class StaticProductsRepository implements ProductsRepository {
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
      });
    const sorted = [...products].sort((left, right) => {
      if (query.sort === 'price-asc') return effectivePrice(left) - effectivePrice(right);
      if (query.sort === 'price-desc') return effectivePrice(right) - effectivePrice(left);
      if (query.sort === 'name') return left.name.localeCompare(right.name);
      return 0;
    });

    // This is the prerender-time source, backed by a bundled 54-product catalogue rather than the
    // database, so its cursor is just an offset into the sorted array. It is deliberately not
    // interchangeable with the API's keyset cursor — nothing carries one across, because a page
    // switching from this repository to the API one starts a fresh query.
    const start = decodeOffset(page?.cursor);
    const limit = page?.limit ?? DEFAULT_PAGE_SIZE;
    const items = sorted.slice(start, start + limit);
    const nextOffset = start + items.length;

    return of({
      items,
      nextCursor: nextOffset < sorted.length ? String(nextOffset) : null,
    });
  }

  getById(groupId: string, productId: string): Observable<Product | null> {
    return of(
      catalogue.products.find(
        (product) => product.groupId === groupId && product.id === productId,
      ) ?? null,
    );
  }
}

function decodeOffset(cursor: string | null | undefined): number {
  const offset = Number(cursor);
  return cursor && Number.isInteger(offset) && offset > 0 ? offset : 0;
}
