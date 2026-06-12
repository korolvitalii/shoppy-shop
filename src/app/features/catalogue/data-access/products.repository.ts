import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Product, ProductSearchQuery } from '../models/product';

@Injectable()
export abstract class ProductsRepository {
  abstract search(groupId: string, query: ProductSearchQuery): Observable<readonly Product[]>;
}

@Injectable()
export class ApiProductsRepository implements ProductsRepository {
  private readonly http = inject(HttpClient);

  search(groupId: string, query: ProductSearchQuery): Observable<readonly Product[]> {
    const params = new HttpParams()
      .set('search', query.search)
      .set('sort', query.sort)
      .set('price', query.price);
    return this.http.get<readonly Product[]>(`/api/product-groups/${groupId}/products`, { params });
  }
}
