import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ConfirmationService } from '../../../../core/confirmation/confirmation.service';
import { BasketService } from '../../data-access/basket.service';
import { type BasketItem } from '../../models/basket-item';

@Component({
  selector: 'app-basket-page',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './basket-page.html',
  styleUrl: './basket-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasketPage {
  protected readonly basket = inject(BasketService);
  private readonly confirmation = inject(ConfirmationService);

  protected async decrease(item: BasketItem): Promise<void> {
    if (item.quantity > 1) {
      this.basket.updateQuantity(item.productId, item.quantity - 1);
      return;
    }
    await this.removeItem(item);
  }

  protected async removeItem(item: BasketItem): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: `Remove ${item.name}?`,
      message: 'This item will be removed from your basket.',
      confirmLabel: 'Remove item',
      tone: 'danger',
    });
    if (confirmed) this.basket.remove(item.productId);
  }

  protected async clearBasket(): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Clear your basket?',
      message: `All ${this.basket.itemCount()} items will be removed. This cannot be undone.`,
      confirmLabel: 'Clear basket',
      tone: 'danger',
    });
    if (confirmed) this.basket.clear();
  }
}
