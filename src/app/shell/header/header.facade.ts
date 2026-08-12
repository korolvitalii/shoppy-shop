import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';

import { ConfirmationService } from '../../core/confirmation/confirmation.service';
import { ThemeService } from '../../core/theme/theme.service';
import {
  AuthenticationService,
  AuthenticationSessionService,
} from '../../features/auth/public-api';
import { BasketService } from '../../features/basket/public-api';
import { FavoritesService } from '../../features/favorites/public-api';

@Injectable()
export class HeaderFacade {
  readonly basket = inject(BasketService);
  readonly favorites = inject(FavoritesService);
  readonly session = inject(AuthenticationSessionService);
  readonly theme = inject(ThemeService);

  private readonly authentication = inject(AuthenticationService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly router = inject(Router);

  async logout(): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: $localize`:@@logoutTitle:Log out of ShoppyShop?`,
      message: $localize`:@@logoutMessage:Your basket stays on this device, but you will need to sign in again.`,
      confirmLabel: $localize`:@@logOutConfirm:Log out`,
      tone: 'danger',
    });
    if (!confirmed) return;

    this.authentication
      .logout()
      .pipe(catchError(() => of(undefined)))
      .subscribe(() => {
        this.session.end();
        void this.router.navigateByUrl('/login', { replaceUrl: true });
      });
  }
}
