import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { type Observable, of } from 'rxjs';

import { PrerenderSnapshot } from '../../../core/prerender/prerender-snapshot';
import catalogue from '../data/catalogue.json';
import { type ProductGroup } from '../models/product-group';
import { requestContext } from './request-context';

export interface CatalogueRequestOptions {
  readonly silent?: boolean;
}

const SNAPSHOT_KEY = 'product-groups';

@Injectable()
export abstract class ProductGroupsRepository {
  abstract getAll(options?: CatalogueRequestOptions): Observable<readonly ProductGroup[]>;
}

@Injectable()
export class ApiProductGroupsRepository implements ProductGroupsRepository {
  private readonly http = inject(HttpClient);
  private readonly snapshot = inject(PrerenderSnapshot);

  getAll(options?: CatalogueRequestOptions): Observable<readonly ProductGroup[]> {
    return this.snapshot.revalidate(SNAPSHOT_KEY, (revalidating) =>
      this.http.get<readonly ProductGroup[]>('/api/product-groups', {
        context: requestContext(options?.silent || revalidating),
      }),
    );
  }
}

@Injectable()
export class StaticProductGroupsRepository implements ProductGroupsRepository {
  private readonly snapshot = inject(PrerenderSnapshot);

  getAll(): Observable<readonly ProductGroup[]> {
    this.snapshot.record(SNAPSHOT_KEY, catalogue.groups);
    return of(catalogue.groups);
  }
}
