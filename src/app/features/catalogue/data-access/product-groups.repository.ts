import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { type Observable } from 'rxjs';

import { PrerenderSnapshot } from '../../../core/prerender/prerender-snapshot';
import { type ProductGroup } from '../models/product-group';
import { type CatalogueRequestOptions, requestContext } from './request-context';

export const PRODUCT_GROUPS_SNAPSHOT_KEY = 'product-groups';

@Injectable()
export abstract class ProductGroupsRepository {
  abstract getAll(options?: CatalogueRequestOptions): Observable<readonly ProductGroup[]>;
}

/** The API answers in the storefront's language (`requestContext` marks each request). */
@Injectable()
export class ApiProductGroupsRepository implements ProductGroupsRepository {
  private readonly http = inject(HttpClient);
  private readonly snapshot = inject(PrerenderSnapshot);

  getAll(options?: CatalogueRequestOptions): Observable<readonly ProductGroup[]> {
    return this.snapshot.revalidate(PRODUCT_GROUPS_SNAPSHOT_KEY, (revalidating) =>
      this.http.get<readonly ProductGroup[]>('/api/product-groups', {
        context: requestContext(options?.silent || revalidating),
      }),
    );
  }
}
