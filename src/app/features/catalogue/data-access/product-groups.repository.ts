import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ProductGroup } from '../models/product-group';

@Injectable()
export abstract class ProductGroupsRepository {
  abstract getAll(): Observable<readonly ProductGroup[]>;
}

@Injectable()
export class ApiProductGroupsRepository implements ProductGroupsRepository {
  private readonly http = inject(HttpClient);

  getAll(): Observable<readonly ProductGroup[]> {
    return this.http.get<readonly ProductGroup[]>('/api/product-groups');
  }
}
