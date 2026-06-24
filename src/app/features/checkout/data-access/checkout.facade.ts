import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { BasketService } from '../../basket/data-access/basket.service';
import {
  CheckoutPaymentToken,
  CreateOrderRequest,
  DeliveryAddress,
  Order,
} from '../models/checkout.models';
import { OrdersRepository } from './orders.repository';
@Injectable()
export class CheckoutFacade {
  private readonly basket = inject(BasketService);
  private readonly orders = inject(OrdersRepository);
  readonly delivery = signal<DeliveryAddress | null>(null);
  readonly paymentToken = signal<CheckoutPaymentToken | null>(null);
  readonly deliveryCharge = signal(4.99);
  readonly subtotal = this.basket.subtotal;
  readonly items = this.basket.items;
  readonly total = computed(() => this.subtotal() + this.deliveryCharge());
  setDelivery(value: DeliveryAddress) {
    this.delivery.set(value);
  }
  setPaymentToken(value: CheckoutPaymentToken) {
    this.paymentToken.set(value);
  }
  createOrder(): Observable<Order> {
    const request: CreateOrderRequest = {
      lines: this.basket.items(),
      delivery: this.delivery()!,
      deliveryMethod: 'standard',
      paymentToken: this.paymentToken()!,
      subtotal: this.subtotal(),
      deliveryCharge: this.deliveryCharge(),
      total: this.total(),
    };
    return this.orders.createOrder(request);
  }
  clearBasket(): void {
    this.basket.clear();
  }
}
