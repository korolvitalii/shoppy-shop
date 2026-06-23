import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CheckoutFacade } from '../../data-access/checkout.facade';
@Component({
  selector: 'app-payment-page',
  imports: [ReactiveFormsModule],
  templateUrl: './payment-page.html',
  styleUrl: '../checkout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentPage {
  private readonly facade = inject(CheckoutFacade);
  private readonly router = inject(Router);
  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    card: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{16}$/)],
    }),
    expiry: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)],
    }),
    cvv: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{3,4}$/)],
    }),
  });
  continue() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const card = this.form.controls.card.value;
    this.facade.setPaymentToken({
      tokenId: `tok_${Date.now()}`,
      brand: card.startsWith('4') ? 'Visa' : 'Card',
      last4: card.slice(-4),
    });
    void this.router.navigateByUrl('/checkout/review');
  }
}
