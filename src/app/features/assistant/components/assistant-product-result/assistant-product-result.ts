import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { type Product } from '../../../../shared/domain/product';
import { AuthenticationSessionService } from '../../../auth/public-api';
import { BasketService } from '../../../basket/public-api';
import { FavoritesService } from '../../../favorites/public-api';

@Component({
  selector: 'app-assistant-product-result',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './assistant-product-result.html',
  styleUrl: './assistant-product-result.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantProductResult {
  private readonly basket = inject(BasketService);
  protected readonly favorites = inject(FavoritesService);
  private readonly router = inject(Router);
  private readonly session = inject(AuthenticationSessionService);
  readonly product = input.required<Product>();
  protected readonly added = signal(false);
  protected readonly effectivePrice = computed(
    () => this.product().salePrice ?? this.product().price,
  );

  protected addToBasket(): void {
    this.basket.add(this.product());
    this.added.set(true);
  }

  protected toggleFavorite(): void {
    if (!this.session.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.favorites.toggle(this.product());
  }
}
