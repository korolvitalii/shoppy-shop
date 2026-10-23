import { inject, Injectable, LOCALE_ID, type Provider } from '@angular/core';

import { getLocaleDefinition } from '../../../core/locale/locale.config';
import { CatalogueDisplay, type CategoryName } from '../../../shared/domain/catalogue-display';
import names from '../data/catalogue.names.json';

type LocalizedName = Readonly<Record<string, string>>;

/**
 * Names from the snapshot the API exports (`catalogue.names.json`), so a restored basket line or a
 * breadcrumb is named without a request. It holds names only: the full catalogue text stays in the
 * server-side prerendering repositories, out of the browser bundle.
 */
@Injectable({ providedIn: 'root' })
export class BundledCatalogueDisplay extends CatalogueDisplay {
  private readonly locale = getLocaleDefinition(inject(LOCALE_ID)).path;
  private readonly groups = new Map<string, LocalizedName>(
    names.groups.map((group) => [group.id, group.name]),
  );
  private readonly products = new Map<string, LocalizedName>(
    names.products.map((product) => [product.id, product.name]),
  );
  readonly categories: readonly CategoryName[] = names.groups.map((group) => ({
    id: group.id,
    name: this.inLocale(group.name),
  }));

  categoryName(groupId: string): string {
    const name = this.groups.get(groupId);
    return name ? this.inLocale(name) : groupId;
  }

  productName(productId: string, savedName: string): string {
    const name = this.products.get(productId);
    return name && Object.values(name).includes(savedName) ? this.inLocale(name) : savedName;
  }

  private inLocale(name: LocalizedName): string {
    return name[this.locale] ?? name[names.sourceLocale];
  }
}

/** Binds the shared `CatalogueDisplay` contract to the catalogue's bundled names. */
export function provideCatalogueDisplay(): Provider {
  return { provide: CatalogueDisplay, useExisting: BundledCatalogueDisplay };
}
