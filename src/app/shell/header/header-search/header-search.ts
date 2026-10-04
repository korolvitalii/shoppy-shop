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
import { Router } from '@angular/router';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  type Observable,
  of,
  startWith,
  switchMap,
} from 'rxjs';

import {
  DEFAULT_PRODUCT_SEARCH_QUERY,
  ProductsRepository,
} from '../../../features/catalogue/public-api';
import { type Product } from '../../../shared/domain/product';
import { HEADER_CATEGORIES } from '../header-categories';
import { SearchSuggestions } from '../search-suggestions/search-suggestions';

const MIN_QUERY_LENGTH = 2;
// The suggestion cap is a page size, so the API returns six rows rather than the whole matching
// catalogue for the dropdown to throw most of away.
const SUGGESTION_LIMIT = 6;

@Component({
  selector: 'app-header-search',
  imports: [ReactiveFormsModule, SearchSuggestions],
  templateUrl: './header-search.html',
  styleUrl: './header-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderSearch {
  protected readonly categories = HEADER_CATEGORIES;
  protected readonly activeSuggestionIndex = signal(-1);
  protected readonly searchForm = new FormGroup({
    query: new FormControl('', { nonNullable: true }),
    category: new FormControl('all', { nonNullable: true }),
  });
  protected readonly suggestions = signal<readonly Product[]>([]);
  protected readonly suggestionsOpen = signal(false);
  protected readonly activeSuggestion = computed(
    () => this.suggestions()[this.activeSuggestionIndex()] ?? null,
  );

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly products = inject(ProductsRepository);
  private readonly router = inject(Router);

  constructor() {
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
        switchMap(({ query, category }) => this.loadSuggestions(query, category)),
        takeUntilDestroyed(),
      )
      .subscribe((suggestions) => this.showSuggestionResults(suggestions));
  }

  @HostListener('document:click', ['$event.target'])
  protected closeSuggestionsFromOutside(target: EventTarget | null): void {
    if (target instanceof Node && !this.element.nativeElement.contains(target)) {
      this.closeSuggestions();
    }
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
    if (this.suggestions().length > 0) this.suggestionsOpen.set(true);
  }

  protected handleSearchKeydown(event: KeyboardEvent): void {
    const suggestions = this.suggestions();
    if (!this.suggestionsOpen() || suggestions.length === 0) return;

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

  /**
   * Suggestions support whatever page the customer is on, so a lookup stays silent: it never raises
   * the global loading bar while typing, and a failure just leaves the dropdown closed.
   */
  private loadSuggestions(query: string, category: string): Observable<readonly Product[]> {
    if (query.length < MIN_QUERY_LENGTH) return of([]);

    return this.products
      .search(
        category,
        { ...DEFAULT_PRODUCT_SEARCH_QUERY, search: query },
        { limit: SUGGESTION_LIMIT },
        { silent: true },
      )
      .pipe(
        map((page) => page.items),
        catchError(() => of([])),
      );
  }

  private showSuggestionResults(suggestions: readonly Product[]): void {
    this.suggestions.set(suggestions);
    this.activeSuggestionIndex.set(-1);
    this.suggestionsOpen.set(
      this.searchForm.controls.query.value.trim().length >= MIN_QUERY_LENGTH &&
        suggestions.length > 0,
    );
  }

  private closeSuggestions(): void {
    this.suggestionsOpen.set(false);
    this.activeSuggestionIndex.set(-1);
  }
}
