import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { ThemeService } from './core/theme/theme.service';
import { ConfirmationDialog } from './shared/ui/confirmation-dialog/confirmation-dialog';
import { ErrorBanner } from './shared/ui/error-banner/error-banner';
import { LoadingIndicator } from './shared/ui/loading-indicator/loading-indicator';
import { AppHeader } from './shell/header/app-header';
import { MobileNavigation } from './shell/mobile-navigation/mobile-navigation';

@Component({
  selector: 'app-root',
  imports: [
    AppHeader,
    ConfirmationDialog,
    ErrorBanner,
    LoadingIndicator,
    MobileNavigation,
    RouterOutlet,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly showHeader = computed(() => !this.currentUrl().startsWith('/login'));

  constructor() {
    void this.theme;
  }
}
