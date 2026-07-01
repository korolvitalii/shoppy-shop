import { type Order } from '../../app/features/checkout/models/checkout.models';

export const mockOrders: readonly Order[] = [
  createOrder({
    id: 'ORD-00003',
    createdAt: '2026-06-27T14:20:00.000Z',
    productId: 'electronics-1',
    groupId: 'electronics',
    name: 'Wireless studio headphones',
    imageUrl: 'https://picsum.photos/seed/shoppyshop-electronics-0/800/600',
    unitPrice: 199,
    quantity: 1,
    deliveryCharge: 4.99,
    brand: 'Visa',
    last4: '4242',
  }),
  createOrder({
    id: 'ORD-00002',
    createdAt: '2026-06-18T10:45:00.000Z',
    productId: 'home-2',
    groupId: 'home',
    name: 'Minimal table lamp',
    imageUrl: 'https://picsum.photos/seed/shoppyshop-home-1/800/600',
    unitPrice: 72.5,
    quantity: 2,
    deliveryCharge: 0,
    brand: 'Mastercard',
    last4: '1881',
  }),
  createOrder({
    id: 'ORD-00001',
    createdAt: '2026-06-08T16:05:00.000Z',
    productId: 'beauty-1',
    groupId: 'beauty',
    name: 'Botanical skincare set',
    imageUrl: 'https://picsum.photos/seed/shoppyshop-beauty-0/800/600',
    unitPrice: 54,
    quantity: 1,
    deliveryCharge: 4.99,
    brand: 'Visa',
    last4: '4242',
  }),
];

interface MockOrderOptions {
  id: string;
  createdAt: string;
  productId: string;
  groupId: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  deliveryCharge: number;
  brand: string;
  last4: string;
}

function createOrder(options: MockOrderOptions): Order {
  const subtotal = options.unitPrice * options.quantity;
  return {
    id: options.id,
    createdAt: options.createdAt,
    status: 'confirmed',
    lines: [
      {
        productId: options.productId,
        groupId: options.groupId,
        name: options.name,
        imageUrl: options.imageUrl,
        unitPrice: options.unitPrice,
        quantity: options.quantity,
      },
    ],
    delivery: {
      name: 'Demo Customer',
      email: 'demo@shoppyshop.test',
      address: '10 Market Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'United Kingdom',
    },
    deliveryMethod: 'standard',
    paymentToken: {
      tokenId: `tok_${options.id.toLowerCase()}`,
      brand: options.brand,
      last4: options.last4,
    },
    subtotal,
    deliveryCharge: options.deliveryCharge,
    total: subtotal + options.deliveryCharge,
  };
}
