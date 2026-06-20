import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

import { BasketService } from '../../features/basket/data-access/basket.service';
import { AuthenticationSessionService } from '../../features/auth/data-access/authentication-session.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {
  protected readonly basket = inject(BasketService);
  protected readonly menuOpen = signal(false);
  private readonly session = inject(AuthenticationSessionService);
  private readonly router = inject(Router);

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }
  protected logout(): void {
    this.session.end();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
