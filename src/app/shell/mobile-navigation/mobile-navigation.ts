import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Heart, History, House, ShoppingBasket } from 'lucide';

import { AuthenticationSessionService } from '../../features/auth/public-api';
import { BasketService } from '../../features/basket/public-api';
import { FavoritesService } from '../../features/favorites/public-api';
import { LucideIcon } from '../../shared/ui/lucide-icon/lucide-icon';

@Component({
  selector: 'app-mobile-navigation-tabs',
  imports: [LucideIcon, RouterLink, RouterLinkActive],
  templateUrl: './mobile-navigation.html',
  styleUrl: './mobile-navigation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileNavigation {
  protected readonly basket = inject(BasketService);
  protected readonly favorites = inject(FavoritesService);
  protected readonly icons = {
    basket: ShoppingBasket,
    favorites: Heart,
    orders: History,
    shop: House,
  };
  protected readonly session = inject(AuthenticationSessionService);
}
