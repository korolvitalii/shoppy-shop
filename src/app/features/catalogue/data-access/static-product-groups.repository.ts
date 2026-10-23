import { inject, Injectable, LOCALE_ID } from '@angular/core';
import { type Observable, of } from 'rxjs';

import { getLocaleDefinition } from '../../../core/locale/locale.config';
import { PrerenderSnapshot } from '../../../core/prerender/prerender-snapshot';
import catalogue from '../data/catalogue.json';
import { type ProductGroup } from '../models/product-group';
import { localizedGroup } from './catalogue-translations';
import {
  PRODUCT_GROUPS_SNAPSHOT_KEY,
  type ProductGroupsRepository,
} from './product-groups.repository';

/**
 * Prerendering's category source (bound in `app.config.server.ts`). It lives apart from the API
 * repository so the browser bundle never includes it, the catalogue or its translations.
 */
@Injectable()
export class StaticProductGroupsRepository implements ProductGroupsRepository {
  private readonly snapshot = inject(PrerenderSnapshot);
  private readonly locale = getLocaleDefinition(inject(LOCALE_ID)).path;

  getAll(): Observable<readonly ProductGroup[]> {
    // Counted like the API counts them: the seed's stored itemCount values are stale.
    const groups = catalogue.groups.map((group) =>
      localizedGroup(
        {
          ...group,
          itemCount: catalogue.products.filter((product) => product.groupId === group.id).length,
        },
        this.locale,
      ),
    );
    this.snapshot.record(PRODUCT_GROUPS_SNAPSHOT_KEY, groups);
    return of(groups);
  }
}
