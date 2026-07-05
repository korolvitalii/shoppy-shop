import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';

import { ProductGroupsRepository } from '../../data-access/product-groups.repository';
import { type ProductGroup } from '../../models/product-group';
import { ProductGroupsPage } from './product-groups-page';

describe('ProductGroupsPage', () => {
  let response: Subject<readonly ProductGroup[]>;
  const repository = { getAll: vi.fn() };

  beforeEach(async () => {
    response = new Subject<readonly ProductGroup[]>();
    repository.getAll.mockReset();
    repository.getAll.mockReturnValue(response);

    await TestBed.configureTestingModule({
      imports: [ProductGroupsPage],
      providers: [provideRouter([]), { provide: ProductGroupsRepository, useValue: repository }],
    }).compileComponents();
  });

  it('shows a loading status while product groups are requested', () => {
    const fixture = TestBed.createComponent(ProductGroupsPage);
    fixture.detectChanges();

    expect(repository.getAll).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Loading product categories',
    );
  });

  it('renders product groups as accessible navigation links', () => {
    const fixture = TestBed.createComponent(ProductGroupsPage);
    fixture.detectChanges();

    response.next([
      {
        id: 'electronics',
        name: 'Electronics',
        description: 'Headphones, gadgets, and travel technology.',
        imageUrl: '/images/electronics.jpg',
        itemCount: 12,
        badge: 'Popular',
      },
    ]);
    response.complete();
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector(
      'a[href="/products/electronics"]',
    ) as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.textContent).toContain('Electronics');
    expect(link.textContent).toContain('12 products');
    expect(link.querySelector('img')?.alt).toBe('Electronics');
  });

  it('shows an empty state when no product groups are available', () => {
    const fixture = TestBed.createComponent(ProductGroupsPage);
    fixture.detectChanges();

    response.next([]);
    response.complete();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No product categories are available yet',
    );
  });

  it('announces request failures and retries on demand', () => {
    const retryResponse = new Subject<readonly ProductGroup[]>();
    repository.getAll.mockReturnValueOnce(response).mockReturnValueOnce(retryResponse);
    const fixture = TestBed.createComponent(ProductGroupsPage);
    fixture.detectChanges();

    response.error(new Error('Network unavailable'));
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('We could not load the product categories');

    (alert.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(repository.getAll).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Loading product categories',
    );

    retryResponse.next([
      {
        id: 'home',
        name: 'Home & living',
        description: 'Considered pieces for every room.',
        imageUrl: '/images/home.jpg',
        itemCount: 8,
        badge: null,
      },
    ]);
    retryResponse.complete();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Home & living');
  });
});
