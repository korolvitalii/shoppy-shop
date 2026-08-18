import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { ConfigService } from './core/config/config.service';
import { SeoService } from './core/seo/seo.service';
import { ThemeService } from './core/theme/theme.service';
import { AssistantWidget } from './features/assistant/components/assistant-widget/assistant-widget';
import { ConfirmationDialog } from './shell/global-ui/confirmation-dialog/confirmation-dialog';
import { ErrorBanner } from './shell/global-ui/error-banner/error-banner';
import { LoadingIndicator } from './shell/global-ui/loading-indicator/loading-indicator';
import { AppHeader } from './shell/header/app-header';
import { MobileNavigation } from './shell/mobile-navigation/mobile-navigation';

@Component({
  selector: 'app-root',
  imports: [
    AppHeader,
    AssistantWidget,
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
  private readonly seo = inject(SeoService);
  protected readonly config = inject(ConfigService);
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  private static readonly FULL_PAGE_ROUTES = ['/login', '/register'];
  protected readonly showHeader = computed(
    () => !App.FULL_PAGE_ROUTES.some((path) => this.currentUrl().startsWith(path)),
  );

  constructor() {
    void this.theme;
    this.router.events
      .pipe(filter((event): event is NavigationStart => event instanceof NavigationStart))
      .subscribe(() => this.seo.beginNavigation());
  }
}
