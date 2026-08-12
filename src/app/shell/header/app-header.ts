import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

import { LanguageSelector } from '../../core/locale/language-selector/language-selector';
import { HeaderFacade } from './header.facade';
import { HEADER_CATEGORIES } from './header-categories';
import { HeaderSearch } from './header-search/header-search';

@Component({
  selector: 'app-header',
  imports: [HeaderSearch, LanguageSelector, RouterLink, RouterLinkActive],
  providers: [HeaderFacade],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {
  protected readonly categories = HEADER_CATEGORIES;
  protected readonly facade = inject(HeaderFacade);
  protected readonly basket = this.facade.basket;
  protected readonly favorites = this.facade.favorites;
  protected readonly menuOpen = signal(false);
  protected readonly session = this.facade.session;
  protected readonly theme = this.facade.theme;

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
}
