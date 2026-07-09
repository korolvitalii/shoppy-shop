import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthenticationSessionService } from '../../features/auth/data-access/authentication-session.service';
import { BasketService } from '../../features/basket/data-access/basket.service';
import { FavoritesService } from '../../features/favorites/data-access/favorites.service';

@Component({
  selector: 'app-mobile-navigation-tabs',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './mobile-navigation.html',
  styleUrl: './mobile-navigation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileNavigation {
  protected readonly basket = inject(BasketService);
  protected readonly favorites = inject(FavoritesService);
  protected readonly session = inject(AuthenticationSessionService);
}
