import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { type ProductGroup } from '../../models/product-group';

@Component({
  selector: 'app-product-group-card',
  imports: [RouterLink],
  templateUrl: './product-group-card.html',
  styleUrl: './product-group-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupCard {
  readonly group = input.required<ProductGroup>();
  readonly productCount = computed(() => {
    const count = this.group().itemCount;
    return `${count} ${count === 1 ? 'product' : 'products'}`;
  });
}
