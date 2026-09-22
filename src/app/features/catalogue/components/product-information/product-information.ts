import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { type Product } from '../../../../shared/domain/product';

@Component({
  selector: 'app-product-information',
  imports: [TitleCasePipe],
  templateUrl: './product-information.html',
  styleUrl: './product-information.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductInformation {
  readonly product = input.required<Product>();
}
