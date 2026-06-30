import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { type ProductGroup } from '../models/product-group';
import { ApiProductGroupsRepository } from './product-groups.repository';

describe('ApiProductGroupsRepository', () => {
  let repository: ApiProductGroupsRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiProductGroupsRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    repository = TestBed.inject(ApiProductGroupsRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('retrieves typed product groups from the API', () => {
    const groups: readonly ProductGroup[] = [
      {
        id: 'home',
        name: 'Home & living',
        description: 'Objects selected for expressive spaces.',
        imageUrl: '/images/home.jpg',
        itemCount: 8,
        badge: null,
      },
    ];
    let actual: readonly ProductGroup[] | undefined;

    repository.getAll().subscribe((result) => (actual = result));
    const request = http.expectOne('/api/product-groups');

    expect(request.request.method).toBe('GET');
    request.flush(groups);
    expect(actual).toEqual(groups);
  });
});
