export interface OrderLine {
  productId: string;
  groupId: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderDeliveryAddress {
  name: string;
  email: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
}

export interface OrderPaymentMethod {
  tokenId: string;
  brand: string;
  last4: string;
}

export interface CreateOrderRequest {
  lines: readonly OrderLine[];
  delivery: OrderDeliveryAddress;
  deliveryMethod: 'standard';
  paymentToken: OrderPaymentMethod;
  subtotal: number;
  deliveryCharge: number;
  total: number;
}

export interface Order extends CreateOrderRequest {
  id: string;
  createdAt: string;
  status: 'confirmed';
}
