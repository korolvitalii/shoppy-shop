import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { type Product } from '../../../features/catalogue/models/product';

@Component({
  selector: 'app-search-suggestions',
  imports: [CurrencyPipe],
  templateUrl: './search-suggestions.html',
  styleUrl: './search-suggestions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchSuggestions {
  readonly activeIndex = input.required<number>();
  readonly products = input.required<readonly Product[]>();
  readonly query = input.required<string>();
  readonly activeIndexChange = output<number>();
  readonly productSelected = output<Product>();

  protected suggestionId(index: number): string {
    return `search-suggestion-${index}`;
  }
}
