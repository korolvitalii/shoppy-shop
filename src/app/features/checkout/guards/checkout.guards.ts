import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { BasketService } from '../../basket/data-access/basket.service';
import { CheckoutFacade } from '../data-access/checkout.facade';
export const basketRequiredGuard: CanActivateFn = () =>
  inject(BasketService).itemCount() > 0 || inject(Router).parseUrl('/basket');
export const deliveryRequiredGuard: CanActivateFn = () =>
  inject(CheckoutFacade).delivery() !== null || inject(Router).parseUrl('/checkout/delivery');
export const paymentRequiredGuard: CanActivateFn = () =>
  inject(CheckoutFacade).paymentToken() !== null || inject(Router).parseUrl('/checkout/payment');
