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
