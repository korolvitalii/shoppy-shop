import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { type Observable, of } from 'rxjs';

import catalogue from '../data/catalogue.json';
import { type Product, type ProductSearchQuery } from '../models/product';

@Injectable()
export abstract class ProductsRepository {
  abstract search(groupId: string, query: ProductSearchQuery): Observable<readonly Product[]>;
  abstract getById(groupId: string, productId: string): Observable<Product | null>;
}

@Injectable()
export class ApiProductsRepository implements ProductsRepository {
  private readonly http = inject(HttpClient);

  search(groupId: string, query: ProductSearchQuery): Observable<readonly Product[]> {
    const params = new HttpParams()
      .set('search', query.search)
      .set('sort', query.sort)
      .set('price', query.price);
    const endpoint =
      groupId === 'all' ? '/api/products' : `/api/product-groups/${groupId}/products`;
    return this.http.get<readonly Product[]>(endpoint, { params });
  }

  getById(groupId: string, productId: string): Observable<Product | null> {
    return this.http.get<Product | null>(`/api/product-groups/${groupId}/products/${productId}`);
  }
}

@Injectable()
export class StaticProductsRepository implements ProductsRepository {
  search(groupId: string, query: ProductSearchQuery): Observable<readonly Product[]> {
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
    return of(
      [...products].sort((left, right) => {
        if (query.sort === 'price-asc') return effectivePrice(left) - effectivePrice(right);
        if (query.sort === 'price-desc') return effectivePrice(right) - effectivePrice(left);
        if (query.sort === 'name') return left.name.localeCompare(right.name);
        return 0;
      }),
    );
  }

  getById(groupId: string, productId: string): Observable<Product | null> {
    return of(
      catalogue.products.find(
        (product) => product.groupId === groupId && product.id === productId,
      ) ?? null,
    );
  }
}
