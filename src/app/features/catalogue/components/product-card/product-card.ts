import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthenticationSessionService } from '../../../auth/data-access/authentication-session.service';
import { FavoritesService } from '../../../favorites/data-access/favorites.service';
import { type Product } from '../../models/product';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  protected readonly favorites = inject(FavoritesService);
  private readonly router = inject(Router);
  private readonly session = inject(AuthenticationSessionService);
  readonly product = input.required<Product>();
  readonly effectivePrice = computed(() => this.product().salePrice ?? this.product().price);
  readonly discount = computed(() => {
    const product = this.product();
    return product.salePrice
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : null;
  });

  protected toggleFavorite(): void {
    if (!this.session.isAuthenticated()) {
      void this.router.navigateByUrl(`/login?returnUrl=${encodeURIComponent(this.router.url)}`);
      return;
    }
    this.favorites.toggle(this.product());
  }
}
