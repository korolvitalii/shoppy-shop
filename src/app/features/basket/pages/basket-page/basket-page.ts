import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ConfirmationService } from '../../../../core/confirmation/confirmation.service';
import { CatalogueDisplay } from '../../../../shared/domain/catalogue-display';
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
  protected readonly catalogueDisplay = inject(CatalogueDisplay);
  // Lines keep the name saved with them; the page shows it in the selected language.
  protected readonly items = computed(() =>
    this.catalogueDisplay.withProductNames(this.basket.items()),
  );

  protected removeLabel(item: BasketItem): string {
    return $localize`:@@removeProductLabel:Remove ${item.name}:productName:`;
  }

  protected decreaseLabel(item: BasketItem): string {
    return $localize`:@@decreaseProductQuantity:Decrease ${item.name}:productName: quantity`;
  }

  protected increaseLabel(item: BasketItem): string {
    return $localize`:@@increaseProductQuantity:Increase ${item.name}:productName: quantity`;
  }

  protected quantityLabel(item: BasketItem): string {
    return $localize`:@@productQuantityLabel:${item.name}:productName: quantity`;
  }

  protected async decrease(item: BasketItem): Promise<void> {
    if (item.quantity > 1) {
      this.basket.updateQuantity(item.productId, item.quantity - 1);
      return;
    }
    await this.removeItem(item);
  }

  protected async removeItem(item: BasketItem): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: $localize`:@@removeProductTitle:Remove ${item.name}:productName:?`,
      message: $localize`:@@removeProductMessage:This item will be removed from your basket.`,
      confirmLabel: $localize`:@@removeItem:Remove item`,
      tone: 'danger',
    });
    if (confirmed) this.basket.remove(item.productId);
  }

  protected async clearBasket(): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: $localize`:@@clearBasketTitle:Clear your basket?`,
      message: $localize`:@@clearBasketMessage:All ${this.basket.itemCount()}:itemCount: items will be removed. This cannot be undone.`,
      confirmLabel: $localize`:@@clearBasketConfirm:Clear basket`,
      tone: 'danger',
    });
    if (confirmed) this.basket.clear();
  }
}
