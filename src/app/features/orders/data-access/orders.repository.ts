import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { type Observable } from 'rxjs';

import { type CreateOrderRequest, type Order } from '../models/order.models';

export interface OrderHistoryCursor {
  readonly before: string;
  readonly beforeId: string;
}

@Injectable()
export abstract class OrdersRepository {
  abstract createOrder(request: CreateOrderRequest, idempotencyKey: string): Observable<Order>;
  abstract getOrders(cursor?: OrderHistoryCursor): Observable<readonly Order[]>;
  abstract getOrderById(id: string): Observable<Order | null>;
}
@Injectable()
export class ApiOrdersRepository implements OrdersRepository {
  private readonly http = inject(HttpClient);

  createOrder(request: CreateOrderRequest, idempotencyKey: string) {
    return this.http.post<Order>('/api/orders', request, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  getOrders(cursor?: OrderHistoryCursor) {
    const params = cursor
      ? new HttpParams().set('before', cursor.before).set('beforeId', cursor.beforeId)
      : undefined;
    return this.http.get<readonly Order[]>('/api/orders', params ? { params } : {});
  }

  getOrderById(id: string) {
    return this.http.get<Order | null>(`/api/orders/${id}`);
  }
}
