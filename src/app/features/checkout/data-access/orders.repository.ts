import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateOrderRequest, Order } from '../models/checkout.models';
@Injectable()
export abstract class OrdersRepository {
  abstract createOrder(request: CreateOrderRequest): Observable<Order>;
  abstract getOrderById(id: string): Observable<Order | null>;
}
@Injectable()
export class ApiOrdersRepository implements OrdersRepository {
  private readonly http = inject(HttpClient);
  createOrder(request: CreateOrderRequest) {
    return this.http.post<Order>('/api/orders', request);
  }
  getOrderById(id: string) {
    return this.http.get<Order | null>(`/api/orders/${id}`);
  }
}
