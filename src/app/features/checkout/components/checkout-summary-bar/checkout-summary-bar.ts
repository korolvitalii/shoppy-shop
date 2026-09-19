import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-checkout-summary-bar',
  imports: [CurrencyPipe],
  templateUrl: './checkout-summary-bar.html',
  styleUrl: './checkout-summary-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutSummaryBar {
  readonly itemCount = input.required<number>();
  readonly total = input.required<number>();
}
