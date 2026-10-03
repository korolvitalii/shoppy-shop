import { inject, Injectable } from '@angular/core';
import {
  catchError,
  connect,
  EMPTY,
  filter,
  map,
  merge,
  type Observable,
  of,
  switchMap,
  take,
} from 'rxjs';

import { type Product } from '../../../shared/domain/product';
import { DEFAULT_PRODUCT_SEARCH_QUERY } from '../models/product';
import { ProductsRepository } from './products.repository';

export type ProductDetailsEvent =
  | { kind: 'product'; product: Product }
  | { kind: 'related'; related: readonly Product[]; total: number | null }
  | { kind: 'not-found' }
  | { kind: 'error' };

@Injectable()
export class ProductDetailsLoader {
  private readonly repository = inject(ProductsRepository);

  load(groupId: string, productId: string): Observable<ProductDetailsEvent> {
    return this.repository.getById(groupId, productId).pipe(
      // Share the prerendered and live emissions between both branches. Every product updates
      // the page, but only the first one found starts the rail, so a live update cannot cancel it.
      connect((product$) =>
        merge(
          product$.pipe(
            map((product): ProductDetailsEvent =>
              product ? { kind: 'product', product } : { kind: 'not-found' },
            ),
          ),
          product$.pipe(
            filter((product): product is Product => product !== null),
            take(1),
            switchMap((product) => this.relatedProducts(product)),
          ),
        ),
      ),
      catchError(() => of<ProductDetailsEvent>({ kind: 'error' })),
    );
  }

  private relatedProducts(product: Product): Observable<ProductDetailsEvent> {
    return this.repository.search(product.groupId, DEFAULT_PRODUCT_SEARCH_QUERY, { limit: 5 }).pipe(
      map((page): ProductDetailsEvent => ({
        kind: 'related',
        related: page.items.filter((item) => item.id !== product.id).slice(0, 4),
        total: page.totalCount,
      })),
      // The rail is supporting content: if it fails the product page stays usable.
      catchError(() => EMPTY),
    );
  }
}
