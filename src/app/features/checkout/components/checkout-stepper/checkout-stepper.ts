import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-checkout-stepper',
  imports: [RouterLink],
  templateUrl: './checkout-stepper.html',
  styleUrl: './checkout-stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutStepper {
  readonly backLabel = input('Go back');
  readonly backRoute = input<string | null>(null);
  readonly currentStep = input.required<1 | 2 | 3>();
  readonly deliveryComplete = input(false);
  readonly paymentComplete = input(false);
}
