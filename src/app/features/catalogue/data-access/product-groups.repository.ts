import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { type Observable, of } from 'rxjs';

import catalogue from '../data/catalogue.json';
import { type ProductGroup } from '../models/product-group';

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

@Injectable()
export class StaticProductGroupsRepository implements ProductGroupsRepository {
  getAll(): Observable<readonly ProductGroup[]> {
    return of(catalogue.groups);
  }
}
