import { CurrencyPipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { type Product } from '../../models/product';

@Component({
  selector: 'app-product-information',
  imports: [CurrencyPipe, TitleCasePipe, UpperCasePipe],
  templateUrl: './product-information.html',
  styleUrl: './product-information.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductInformation {
  readonly product = input.required<Product>();
  readonly effectivePrice = input.required<number>();
}
