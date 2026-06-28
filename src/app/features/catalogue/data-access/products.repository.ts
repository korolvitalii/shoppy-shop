import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Product, ProductSearchQuery } from '../models/product';

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
