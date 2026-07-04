import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';

import { AuthenticationSessionService } from '../../features/auth/data-access/authentication-session.service';
import { BasketService } from '../../features/basket/data-access/basket.service';
import { ProductsRepository } from '../../features/catalogue/data-access/products.repository';
import { type Product } from '../../features/catalogue/models/product';
import { SearchSuggestions } from './search-suggestions/search-suggestions';

@Component({
  selector: 'app-header',
  imports: [ReactiveFormsModule, RouterLink, RouterLinkActive, SearchSuggestions],
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
  protected readonly activeSuggestionIndex = signal(-1);
  protected readonly basket = inject(BasketService);
  protected readonly menuOpen = signal(false);
  protected readonly searchForm = new FormGroup({
    query: new FormControl('', { nonNullable: true }),
    category: new FormControl('all', { nonNullable: true }),
  });
  protected readonly session = inject(AuthenticationSessionService);
  protected readonly suggestions = signal<readonly Product[]>([]);
  protected readonly suggestionsOpen = signal(false);
  protected readonly activeSuggestion = computed(
    () => this.suggestions()[this.activeSuggestionIndex()] ?? null,
  );
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly productsRepository = inject(ProductsRepository);
  private readonly router = inject(Router);

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));

    combineLatest([
      this.searchForm.controls.query.valueChanges.pipe(
        startWith(this.searchForm.controls.query.value),
      ),
      this.searchForm.controls.category.valueChanges.pipe(
        startWith(this.searchForm.controls.category.value),
      ),
    ])
      .pipe(
        debounceTime(250),
        map(([query, category]) => ({ query: query.trim(), category })),
        distinctUntilChanged(
          (previous, current) =>
            previous.query === current.query && previous.category === current.category,
        ),
        switchMap(({ query, category }) =>
          query.length < 2
            ? of([])
            : this.productsRepository
                .search(category, { search: query, sort: 'featured', price: 'all' })
                .pipe(
                  map((products) => products.slice(0, 6)),
                  catchError(() => of([])),
                ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((suggestions) => {
        this.suggestions.set(suggestions);
        this.activeSuggestionIndex.set(-1);
        this.suggestionsOpen.set(
          this.searchForm.controls.query.value.trim().length >= 2 && suggestions.length > 0,
        );
      });
  }

  @HostListener('document:click', ['$event.target'])
  protected closeSuggestionsFromOutside(target: EventTarget | null): void {
    if (target instanceof Node && !this.element.nativeElement.contains(target)) {
      this.closeSuggestions();
    }
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
    this.closeSuggestions();
  }

  protected showSuggestions(): void {
    if (this.suggestions().length > 0) {
      this.suggestionsOpen.set(true);
    }
  }

  protected handleSearchKeydown(event: KeyboardEvent): void {
    const suggestions = this.suggestions();
    if (!this.suggestionsOpen() || suggestions.length === 0) {
      return;
    }

    const lastIndex = suggestions.length - 1;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeSuggestionIndex.update((index) => (index >= lastIndex ? 0 : index + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeSuggestionIndex.update((index) => (index <= 0 ? lastIndex : index - 1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.activeSuggestionIndex.set(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.activeSuggestionIndex.set(lastIndex);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeSuggestions();
    } else if (event.key === 'Enter' && this.activeSuggestion()) {
      event.preventDefault();
      this.openSuggestion(this.activeSuggestion()!);
    }
  }

  protected openSuggestion(product: Product): void {
    this.searchForm.controls.query.setValue(product.name, { emitEvent: false });
    this.closeSuggestions();
    void this.router.navigate(['/products', product.groupId, product.id]);
  }

  protected suggestionId(index: number): string {
    return `search-suggestion-${index}`;
  }

  protected logout(): void {
    this.session.end();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private closeSuggestions(): void {
    this.suggestionsOpen.set(false);
    this.activeSuggestionIndex.set(-1);
  }
}
