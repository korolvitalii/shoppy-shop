import { delay, http, HttpResponse } from 'msw';

import { mockProductGroups } from './data/product-groups';
import { mockProducts } from './data/products';
import { CreateOrderRequest, Order } from '../app/features/checkout/models/checkout.models';
const orders = new Map<string, Order>();

export const handlers = [
  http.get('/api/product-groups', async () => {
    await delay(350);
    return HttpResponse.json(mockProductGroups);
  }),
  http.get('/api/product-groups/:groupId/products', async ({ params, request }) => {
    await delay(300);
    const url = new URL(request.url);
    const search = (url.searchParams.get('search') ?? '').toLowerCase();
    const price = url.searchParams.get('price') ?? 'all';
    const sort = url.searchParams.get('sort') ?? 'featured';

    const effectivePrice = (product: (typeof mockProducts)[number]) =>
      product.salePrice ?? product.price;
    let products = mockProducts.filter(
      (product) =>
        product.groupId === params['groupId'] &&
        `${product.name} ${product.brand}`.toLowerCase().includes(search),
    );
    products = products.filter((product) => {
      const amount = effectivePrice(product);
      if (price === '0-50') return amount < 50;
      if (price === '50-200') return amount >= 50 && amount < 200;
      if (price === '200+') return amount >= 200;
      return true;
    });
    products = [...products].sort((left, right) => {
      if (sort === 'price-asc') return effectivePrice(left) - effectivePrice(right);
      if (sort === 'price-desc') return effectivePrice(right) - effectivePrice(left);
      if (sort === 'name') return left.name.localeCompare(right.name);
      return 0;
    });

    return HttpResponse.json(products);
  }),
  http.get('/api/product-groups/:groupId/products/:productId', async ({ params }) => {
    await delay(250);
    const product = mockProducts.find(
      (item) => item.groupId === params['groupId'] && item.id === params['productId'],
    );
    return HttpResponse.json(product ?? null);
  }),
  http.post('/api/orders', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as CreateOrderRequest;
    const id = `ORD-${String(orders.size + 1).padStart(5, '0')}`;
    const order: Order = {
      ...body,
      id,
      createdAt: new Date('2026-06-23T18:40:00Z').toISOString(),
      status: 'confirmed',
    };
    orders.set(id, order);
    return HttpResponse.json(order, { status: 201 });
  }),
  http.get('/api/orders/:orderId', async ({ params }) => {
    await delay(200);
    return HttpResponse.json(orders.get(String(params['orderId'])) ?? null);
  }),
];
