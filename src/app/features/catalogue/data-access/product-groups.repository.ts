import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { type Observable, of } from 'rxjs';

import { SKIP_ERROR_NOTIFICATION } from '../../../core/errors/error-context';
import { SKIP_GLOBAL_LOADING } from '../../../core/loading/loading-context';
import catalogue from '../data/catalogue.json';
import { type ProductGroup } from '../models/product-group';

export interface CatalogueRequestOptions {
  readonly silent?: boolean;
}

const silentContext = () =>
  new HttpContext().set(SKIP_ERROR_NOTIFICATION, true).set(SKIP_GLOBAL_LOADING, true);

@Injectable()
export abstract class ProductGroupsRepository {
  abstract getAll(options?: CatalogueRequestOptions): Observable<readonly ProductGroup[]>;
}

@Injectable()
export class ApiProductGroupsRepository implements ProductGroupsRepository {
  private readonly http = inject(HttpClient);

  getAll(options?: CatalogueRequestOptions): Observable<readonly ProductGroup[]> {
    return this.http.get<readonly ProductGroup[]>('/api/product-groups', {
      context: options?.silent ? silentContext() : new HttpContext(),
    });
  }
}

@Injectable()
export class StaticProductGroupsRepository implements ProductGroupsRepository {
  getAll(): Observable<readonly ProductGroup[]> {
    return of(catalogue.groups);
  }
}
