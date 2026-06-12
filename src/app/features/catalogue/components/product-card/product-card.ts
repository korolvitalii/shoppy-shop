import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../../models/product';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly effectivePrice = computed(() => this.product().salePrice ?? this.product().price);
  readonly discount = computed(() => {
    const product = this.product();
    return product.salePrice
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : null;
  });
}
