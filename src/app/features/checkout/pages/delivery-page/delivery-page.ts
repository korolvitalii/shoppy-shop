import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { CheckoutFacade } from '../../data-access/checkout.facade';
@Component({
  selector: 'app-delivery-page',
  imports: [ReactiveFormsModule],
  templateUrl: './delivery-page.html',
  styleUrl: '../checkout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryPage {
  private readonly facade = inject(CheckoutFacade);
  private readonly router = inject(Router);
  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    postcode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[A-Z0-9 ]{5,8}$/i)],
    }),
    country: new FormControl('United Kingdom', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  continue() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.facade.setDelivery(this.form.getRawValue());
    void this.router.navigateByUrl('/checkout/payment');
  }
}
