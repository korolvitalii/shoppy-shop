import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { BasketService } from '../../basket/public-api';
import { CheckoutFacade } from '../data-access/checkout.facade';
export const basketRequiredGuard: CanActivateFn = () => {
  const basket = inject(BasketService);
  const router = inject(Router);
  return basket.restored.then(() => basket.itemCount() > 0 || router.parseUrl('/basket'));
};
export const deliveryRequiredGuard: CanActivateFn = () =>
  inject(CheckoutFacade).delivery() !== null || inject(Router).parseUrl('/checkout/delivery');
export const paymentRequiredGuard: CanActivateFn = () =>
  inject(CheckoutFacade).paymentToken() !== null || inject(Router).parseUrl('/checkout/payment');
