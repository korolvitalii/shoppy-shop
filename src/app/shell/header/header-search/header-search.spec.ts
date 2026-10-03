import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { apiErrorInterceptor } from '../../../core/errors/api-error.interceptor';
import { ErrorNotificationService } from '../../../core/errors/error-notification.service';
import { loadingInterceptor } from '../../../core/loading/loading.interceptor';
import { LoadingService } from '../../../core/loading/loading.service';
import { ApiProductsRepository, ProductsRepository } from '../../../features/catalogue/public-api';
import { type Product } from '../../../shared/domain/product';
import { HeaderSearch } from './header-search';

const product: Product = {
  id: 'electronics-1',
  groupId: 'electronics',
  name: 'Wireless Headphones',
  brand: 'Sonic Studio',
  description: 'Comfortable headphones',
  imageUrl: '/headphones.jpg',
  price: 129,
  salePrice: 99,
  inStock: true,
  isNew: false,
  giftWrappable: false,
};

describe('HeaderSearch', () => {
  let fixture: ComponentFixture<HeaderSearch>;
  let http: HttpTestingController;
  let input: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderSearch],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([loadingInterceptor, apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: ProductsRepository, useClass: ApiProductsRepository },
      ],
    }).compileComponents();

    vi.useFakeTimers();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HeaderSearch);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  async function type(value: string): Promise<void> {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(250);
    fixture.detectChanges();
  }

  const suggestionRequest = () => http.expectOne((request) => request.url === '/api/products');

  function listbox(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement | null;
  }

  it('waits for two characters before asking for suggestions', async () => {
    await type('w');
    http.expectNone((request) => request.url === '/api/products');

    await type('wi');
    const request = suggestionRequest();

    expect(request.request.params.get('search')).toBe('wi');
    expect(request.request.params.get('limit')).toBe('6');
    request.flush({ items: [product], nextCursor: null, totalCount: 1 });
  });

  it('cancels the previous lookup when the query changes', async () => {
    await type('wire');
    const first = suggestionRequest();

    await type('wirel');
    const second = suggestionRequest();
    second.flush({ items: [product], nextCursor: null, totalCount: 1 });
    fixture.detectChanges();

    expect(first.cancelled).toBe(true);
    expect(listbox()?.textContent).toContain('Wireless Headphones');
  });

  it('keeps a slow or failed lookup out of the global loading bar and error banner', async () => {
    await type('wire');
    const request = suggestionRequest();
    await vi.advanceTimersByTimeAsync(500);

    expect(TestBed.inject(LoadingService).isLoading()).toBe(false);

    request.flush({ title: 'Server error' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(TestBed.inject(ErrorNotificationService).current()).toBeNull();
    expect(listbox()).toBeNull();
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the suggestions on Escape', async () => {
    await type('head');
    suggestionRequest().flush({ items: [product], nextCursor: null, totalCount: 1 });
    fixture.detectChanges();
    expect(listbox()).not.toBeNull();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(listbox()).toBeNull();
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });
});
