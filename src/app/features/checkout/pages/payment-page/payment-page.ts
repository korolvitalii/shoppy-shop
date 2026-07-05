import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  type AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CheckoutStepper } from '../../components/checkout-stepper/checkout-stepper';
import { CheckoutFacade } from '../../data-access/checkout.facade';
@Component({
  selector: 'app-payment-page',
  imports: [CheckoutStepper, ReactiveFormsModule, RouterLink],
  templateUrl: './payment-page.html',
  styleUrl: '../checkout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentPage {
  protected readonly facade = inject(CheckoutFacade);
  protected readonly editingPayment = signal(this.facade.paymentToken() === null);
  protected readonly submitted = signal(false);
  private readonly router = inject(Router);
  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    card: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, cardNumberValidator],
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

  protected formatCard(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(.{4})/g, '$1 ')
      .trim();
    this.form.controls.card.setValue(value);
  }

  protected formatExpiry(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 4);
    this.form.controls.expiry.setValue(
      digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits,
    );
  }

  protected changePayment(): void {
    this.facade.clearPaymentToken();
    this.editingPayment.set(true);
  }

  continue(event?: SubmitEvent): void {
    event?.preventDefault();
    if (!this.editingPayment() && this.facade.paymentToken()) {
      void this.router.navigateByUrl('/checkout/review');
      return;
    }

    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const card = this.form.controls.card.value.replace(/\s/g, '');
    this.facade.setPaymentToken({
      tokenId: `tok_${Date.now()}`,
      brand: card.startsWith('4') ? 'Visa' : 'Card',
      last4: card.slice(-4),
    });
    void this.router.navigateByUrl('/checkout/review');
  }
}

function cardNumberValidator(control: AbstractControl<string>): ValidationErrors | null {
  return /^\d{16}$/.test(control.value.replace(/\s/g, '')) ? null : { cardNumber: true };
}
