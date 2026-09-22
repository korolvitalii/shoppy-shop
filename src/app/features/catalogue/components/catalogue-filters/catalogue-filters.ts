import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { type PriceRange, type ProductSearchQuery } from '../../models/product';
import { type ProductGroup } from '../../models/product-group';

@Component({
  selector: 'app-catalogue-filters',
  imports: [RouterLink],
  templateUrl: './catalogue-filters.html',
  styleUrl: './catalogue-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogueFilters {
  readonly categories = input.required<readonly ProductGroup[]>();
  readonly activeGroupId = input.required<string>();
  readonly query = input.required<ProductSearchQuery>();

  readonly priceChange = output<PriceRange>();
  readonly inStockChange = output<boolean>();
  readonly isNewChange = output<boolean>();
  readonly giftWrappableChange = output<boolean>();
  readonly filtersReset = output<void>();
}
