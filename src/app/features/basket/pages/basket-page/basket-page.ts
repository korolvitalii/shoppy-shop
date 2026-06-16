import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BasketService } from '../../data-access/basket.service';

@Component({
  selector: 'app-basket-page',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './basket-page.html',
  styleUrl: './basket-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasketPage {
  protected readonly basket = inject(BasketService);
}
