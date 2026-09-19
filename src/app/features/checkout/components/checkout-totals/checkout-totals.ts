import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-checkout-totals',
  imports: [CurrencyPipe],
  templateUrl: './checkout-totals.html',
  styleUrl: './checkout-totals.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutTotals {
  readonly subtotal = input.required<number>();
  readonly deliveryCharge = input.required<number>();
  readonly total = input.required<number>();
}
