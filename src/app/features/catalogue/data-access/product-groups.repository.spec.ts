import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SKIP_ERROR_NOTIFICATION } from '../../../core/errors/error-context';
import { SKIP_GLOBAL_LOADING } from '../../../core/loading/loading-context';
import { prerender, shipWithPage } from '../../../core/prerender/prerender-snapshot.testing';
import catalogue from '../data/catalogue.json';
import { type ProductGroup } from '../models/product-group';
import {
  ApiProductGroupsRepository,
  StaticProductGroupsRepository,
} from './product-groups.repository';

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

  it('reports failures globally by default', () => {
    repository.getAll().subscribe({ error: () => undefined });
    const { context } = http.expectOne('/api/product-groups').request;

    expect(context.get(SKIP_ERROR_NOTIFICATION)).toBe(false);
    expect(context.get(SKIP_GLOBAL_LOADING)).toBe(false);
  });

  it('keeps a silent request out of the global banner and loading bar', () => {
    // Interceptors run before the caller's catchError, so opting out has to happen on the
    // request: a background lookup must not put an error banner over a page that rendered.
    repository.getAll({ silent: true }).subscribe({ error: () => undefined });
    const { context } = http.expectOne('/api/product-groups').request;

    expect(context.get(SKIP_ERROR_NOTIFICATION)).toBe(true);
    expect(context.get(SKIP_GLOBAL_LOADING)).toBe(true);
  });
});

describe('ApiProductGroupsRepository on a prerendered page', () => {
  let removeState: () => void;

  beforeEach(() => {
    const state = prerender([StaticProductGroupsRepository], () =>
      TestBed.inject(StaticProductGroupsRepository).getAll().subscribe(),
    );
    TestBed.configureTestingModule({
      providers: [ApiProductGroupsRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    removeState = shipWithPage(state);
  });

  afterEach(() => removeState());

  it('hydrates with the groups the page was prerendered from, then revalidates silently', () => {
    const repository = TestBed.inject(ApiProductGroupsRepository);
    const http = TestBed.inject(HttpTestingController);
    const emitted: (readonly ProductGroup[])[] = [];
    const live = catalogue.groups.slice(0, 2);

    repository.getAll().subscribe((groups) => emitted.push(groups));
    expect(emitted).toEqual([catalogue.groups]);

    const request = http.expectOne('/api/product-groups');
    expect(request.request.context.get(SKIP_ERROR_NOTIFICATION)).toBe(true);
    expect(request.request.context.get(SKIP_GLOBAL_LOADING)).toBe(true);
    request.flush(live);

    expect(emitted).toEqual([catalogue.groups, live]);
    http.verify();
  });
});

describe('StaticProductGroupsRepository', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [StaticProductGroupsRepository] }));

  it('serves all stable catalogue groups during prerendering', () => {
    const repository = TestBed.inject(StaticProductGroupsRepository);
    let ids: readonly string[] = [];
    repository.getAll().subscribe((groups) => (ids = groups.map((group) => group.id)));
    expect(ids).toEqual(['beauty', 'electronics', 'fashion', 'home', 'accessories', 'gifts']);
  });
});
