import { I18nPluralPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { type ProductGroup } from '../../models/product-group';

@Component({
  selector: 'app-product-group-card',
  imports: [RouterLink, I18nPluralPipe],
  templateUrl: './product-group-card.html',
  styleUrl: './product-group-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupCard {
  // Not an ICU message: on this prerendered card the ICU failed hydration in the browser retest,
  // while the pipe renders one text node. Every CLDR plural category has its own message, and `#`
  // stands for the count (in some languages `one` also covers 21 and 31), so a new language needs
  // translations only. Categories a language does not use fall back to `other`.
  readonly productCountMessages = {
    zero: $localize`:@@categoryProductsZero:# products`,
    one: $localize`:@@categoryProductOne:# product`,
    two: $localize`:@@categoryProductsTwo:# products`,
    few: $localize`:@@categoryProductsFew:# products`,
    many: $localize`:@@categoryProductsMany:# products`,
    other: $localize`:@@categoryProductsOther:# products`,
  };
  readonly group = input.required<ProductGroup>();
  readonly imageLoading = input<'lazy' | 'eager'>('lazy');
  readonly imagePriority = input<'auto' | 'high'>('auto');
}
