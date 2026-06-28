import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

import { BasketService } from '../../features/basket/data-access/basket.service';
import { AuthenticationSessionService } from '../../features/auth/data-access/authentication-session.service';

@Component({
  selector: 'app-header',
  imports: [ReactiveFormsModule, RouterLink, RouterLinkActive],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {
  protected readonly categories = [
    { id: 'beauty', label: 'Beauty' },
    { id: 'electronics', label: 'Electronics' },
    { id: 'fashion', label: 'Fashion' },
    { id: 'home', label: 'Home & living' },
    { id: 'accessories', label: 'Accessories' },
    { id: 'gifts', label: 'Gifts' },
  ] as const;
  protected readonly basket = inject(BasketService);
  protected readonly menuOpen = signal(false);
  protected readonly searchForm = new FormGroup({
    query: new FormControl('', { nonNullable: true }),
    category: new FormControl('all', { nonNullable: true }),
  });
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

  protected search(): void {
    const { query, category } = this.searchForm.getRawValue();
    const destination = category === 'all' ? 'search' : category;
    void this.router.navigate(['/products', destination], {
      queryParams: { search: query.trim() },
    });
  }

  protected logout(): void {
    this.session.end();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
