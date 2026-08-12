import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { type Observable } from 'rxjs';

import { type Product } from '../../../shared/domain/product';

@Injectable({ providedIn: 'root' })
export class FavoritesApiClient {
  private readonly http = inject(HttpClient);

  getAll(): Observable<readonly Product[]> {
    return this.http.get<readonly Product[]>('/api/favorites');
  }

  add(productId: string): Observable<void> {
    return this.http.put<void>(`/api/favorites/${productId}`, {});
  }

  remove(productId: string): Observable<void> {
    return this.http.delete<void>(`/api/favorites/${productId}`);
  }

  clear(): Observable<void> {
    return this.http.delete<void>('/api/favorites');
  }
}
