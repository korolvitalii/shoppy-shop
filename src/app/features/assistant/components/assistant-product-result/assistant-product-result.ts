import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { type Product } from '../../../../shared/domain/product';

@Component({
  selector: 'app-assistant-product-result',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './assistant-product-result.html',
  styleUrl: './assistant-product-result.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantProductResult {
  readonly product = input.required<Product>();
  readonly favorite = input(false);
  readonly added = input(false);
  readonly favoriteToggle = output<void>();
  readonly basketAdd = output<void>();
  protected readonly favoriteButtonLabel = computed(() => {
    const name = this.product().name;
    return this.favorite()
      ? $localize`:@@removeProductFromFavourites:Remove ${name}:productName: from favourites`
      : $localize`:@@addProductToFavourites:Add ${name}:productName: to favourites`;
  });
  protected readonly effectivePrice = computed(
    () => this.product().salePrice ?? this.product().price,
  );
}
