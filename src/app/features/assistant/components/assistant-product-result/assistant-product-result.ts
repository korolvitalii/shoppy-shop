import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';

import { BasketService } from '../../../basket/data-access/basket.service';
import { ProductCard } from '../../../catalogue/components/product-card/product-card';
import { type Product } from '../../../catalogue/models/product';

@Component({
  selector: 'app-assistant-product-result',
  imports: [ProductCard],
  templateUrl: './assistant-product-result.html',
  styleUrl: './assistant-product-result.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantProductResult {
  private readonly basket = inject(BasketService);
  readonly product = input.required<Product>();
  protected readonly added = signal(false);

  protected addToBasket(): void {
    this.basket.add(this.product());
    this.added.set(true);
  }
}
