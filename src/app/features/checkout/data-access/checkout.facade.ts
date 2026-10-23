import { computed, inject, Injectable, signal } from '@angular/core';
import { type Observable } from 'rxjs';

import { CatalogueDisplay } from '../../../shared/domain/catalogue-display';
import { BasketService } from '../../basket/public-api';
import { type CreateOrderRequest, type Order, OrdersRepository } from '../../orders/public-api';
import { type CheckoutPaymentToken, type DeliveryAddress } from '../models/checkout.models';

@Injectable()
export class CheckoutFacade {
  private readonly basket = inject(BasketService);
  private readonly orders = inject(OrdersRepository);
  private readonly catalogueDisplay = inject(CatalogueDisplay);
  readonly delivery = signal<DeliveryAddress | null>(null);
  readonly paymentToken = signal<CheckoutPaymentToken | null>(null);
  readonly deliveryCharge = signal(4.99);
  readonly subtotal = this.basket.subtotal;
  /** Basket lines for display, named in the selected language. */
  readonly items = computed(() => this.catalogueDisplay.withProductNames(this.basket.items()));
  readonly itemCount = this.basket.itemCount;
  readonly total = computed(() => this.subtotal() + this.deliveryCharge());
  private readonly idempotencyKey = crypto.randomUUID();

  setDelivery(value: DeliveryAddress) {
    this.delivery.set(value);
  }

  setPaymentToken(value: CheckoutPaymentToken) {
    this.paymentToken.set(value);
  }

  clearPaymentToken(): void {
    this.paymentToken.set(null);
  }

  createOrder(): Observable<Order> {
    const request: CreateOrderRequest = {
      // The saved lines, not `items`: an order records canonical data, never display text.
      lines: this.basket.items(),
      delivery: this.delivery()!,
      deliveryMethod: 'standard',
      paymentToken: this.paymentToken()!,
      subtotal: this.subtotal(),
      deliveryCharge: this.deliveryCharge(),
      total: this.total(),
    };
    return this.orders.createOrder(request, this.idempotencyKey);
  }

  clearBasket(): void {
    this.basket.clear();
  }
}
