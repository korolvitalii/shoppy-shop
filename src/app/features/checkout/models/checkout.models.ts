import { BasketItem } from '../../basket/models/basket-item';
export interface DeliveryAddress {
  name: string;
  email: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
}
export type DeliveryMethod = 'standard';
export interface CheckoutPaymentToken {
  tokenId: string;
  brand: string;
  last4: string;
}
export interface OrderLine extends BasketItem {}
export interface CreateOrderRequest {
  lines: readonly OrderLine[];
  delivery: DeliveryAddress;
  deliveryMethod: DeliveryMethod;
  paymentToken: CheckoutPaymentToken;
  subtotal: number;
  deliveryCharge: number;
  total: number;
}
export interface Order extends CreateOrderRequest {
  id: string;
  createdAt: string;
  status: 'confirmed';
}
