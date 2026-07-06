import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CheckoutStepper } from './checkout-stepper';

describe('CheckoutStepper', () => {
  it('links completed steps and identifies the current step', async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutStepper],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CheckoutStepper);
    fixture.componentRef.setInput('backRoute', '/basket');
    fixture.componentRef.setInput('backLabel', 'Back to basket');
    fixture.componentRef.setInput('currentStep', 3);
    fixture.componentRef.setInput('deliveryComplete', true);
    fixture.componentRef.setInput('paymentComplete', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Checkout progress',
    );
    expect(fixture.nativeElement.querySelector('a[href="/checkout/delivery"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/checkout/payment"]')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('a[href="/basket"]')?.getAttribute('aria-label'),
    ).toBe('Back to basket');
    expect(fixture.nativeElement.querySelector('[aria-current="step"]')?.textContent).toContain(
      'Review',
    );
  });

  it('does not link steps whose requirements are incomplete', async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutStepper],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CheckoutStepper);
    fixture.componentRef.setInput('currentStep', 1);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a[href="/checkout/payment"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/checkout/review"]')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('[aria-disabled="true"]')).toHaveLength(2);
  });
});
