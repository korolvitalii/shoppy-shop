import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { type Observable } from 'rxjs';

import { LOCALIZED_CONTENT } from '../../../core/locale/locale-context';
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

/** Every response names its lines in the storefront's language (`OrderLine.displayName`). */
@Injectable()
export class ApiOrdersRepository implements OrdersRepository {
  private readonly http = inject(HttpClient);

  createOrder(request: CreateOrderRequest, idempotencyKey: string) {
    return this.http.post<Order>('/api/orders', request, {
      headers: { 'Idempotency-Key': idempotencyKey },
      context: localized(),
    });
  }

  getOrders(cursor?: OrderHistoryCursor) {
    const params = cursor
      ? new HttpParams().set('before', cursor.before).set('beforeId', cursor.beforeId)
      : undefined;
    return this.http.get<readonly Order[]>('/api/orders', { params, context: localized() });
  }

  getOrderById(id: string) {
    return this.http.get<Order | null>(`/api/orders/${id}`, { context: localized() });
  }
}

function localized(): HttpContext {
  return new HttpContext().set(LOCALIZED_CONTENT, true);
}
