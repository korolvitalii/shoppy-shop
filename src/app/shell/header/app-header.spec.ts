import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { ConfirmationService } from '../../core/confirmation/confirmation.service';
import { AuthenticationSessionService } from '../../features/auth/data-access/authentication-session.service';
import { BasketService } from '../../features/basket/data-access/basket.service';
import { ProductsRepository } from '../../features/catalogue/data-access/products.repository';
import { type Product } from '../../features/catalogue/models/product';
import { AppHeader } from './app-header';

describe('AppHeader', () => {
  const basket = { itemCount: signal(3) };
  const authenticated = signal(false);
  const session = { isAuthenticated: authenticated, end: vi.fn() };
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
  };
  const productsRepository = { search: vi.fn(), getById: vi.fn() };
  const confirmation = { confirm: vi.fn() };

  afterEach(() => vi.useRealTimers());

  beforeEach(async () => {
    authenticated.set(false);
    session.end.mockReset();
    productsRepository.search.mockReset();
    productsRepository.search.mockReturnValue(of([product]));
    confirmation.confirm.mockReset();
    confirmation.confirm.mockResolvedValue(true);
    await TestBed.configureTestingModule({
      imports: [AppHeader],
      providers: [
        provideRouter([]),
        { provide: BasketService, useValue: basket },
        { provide: AuthenticationSessionService, useValue: session },
        { provide: ProductsRepository, useValue: productsRepository },
        { provide: ConfirmationService, useValue: confirmation },
      ],
    }).compileComponents();
  });

  it('shows customer links and the basket count when authenticated', () => {
    authenticated.set(true);
    const fixture = TestBed.createComponent(AppHeader);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[aria-label="ShoppyShop home"]')).toBeTruthy();
    expect(element.querySelector('nav[aria-label="Primary navigation"]')).toBeTruthy();
    const navigation = element.querySelector('nav[aria-label="Primary navigation"]') as HTMLElement;
    expect(navigation.querySelector('a[href="/products"]')?.textContent).toContain(
      'All categories',
    );
    expect(element.querySelector('a[href="/basket"]')?.textContent).toContain('3');
    expect(element.querySelector('a[href="/orders"]')?.textContent).toContain('Orders');
  });

  it('shows sign in and hides customer links when browsing anonymously', () => {
    const fixture = TestBed.createComponent(AppHeader);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('a[href="/login"]')?.textContent).toContain('Sign in');
    expect(element.querySelector('a[href="/orders"]')).toBeNull();
    expect(element.querySelector('a[href="/basket"]')).toBeNull();
    expect(element.textContent).not.toContain('Log out');
  });

  it('only logs out after destructive action confirmation', async () => {
    authenticated.set(true);
    confirmation.confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const fixture = TestBed.createComponent(AppHeader);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.logout-button') as HTMLButtonElement;

    button.click();
    await fixture.whenStable();
    expect(session.end).not.toHaveBeenCalled();

    button.click();
    await fixture.whenStable();
    expect(session.end).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });

  it('renders a distinctive brand mark and an accessible product search', () => {
    const fixture = TestBed.createComponent(AppHeader);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[aria-label="ShoppyShop home"] svg')).toBeTruthy();
    expect(element.querySelector('form[role="search"]')).toBeTruthy();
    expect(element.querySelector('input[type="search"]')?.getAttribute('placeholder')).toBe(
      'Search products, brands and more',
    );
    expect(element.querySelectorAll('#search-category option')).toHaveLength(7);
  });

  it('searches within the selected category using URL-backed state', () => {
    const fixture = TestBed.createComponent(AppHeader);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    input.value = 'wireless headphones';
    input.dispatchEvent(new Event('input'));
    select.value = 'electronics';
    select.dispatchEvent(new Event('change'));
    (fixture.nativeElement.querySelector('form[role="search"]') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );

    expect(navigate).toHaveBeenCalledWith(['/products', 'electronics'], {
      queryParams: { search: 'wireless headphones' },
    });
  });

  it('shows category-aware product suggestions after typing', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(AppHeader);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;

    select.value = 'electronics';
    select.dispatchEvent(new Event('change'));
    input.value = 'wire';
    input.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(250);
    fixture.detectChanges();

    expect(productsRepository.search).toHaveBeenCalledWith('electronics', {
      search: 'wire',
      sort: 'featured',
      price: 'all',
    });
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('[role="listbox"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[role="option"]')?.textContent).toContain(
      'Wireless Headphones',
    );
  });

  it('supports keyboard selection of a suggested product', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(AppHeader);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;

    input.value = 'head';
    input.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(250);
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();

    expect(input.getAttribute('aria-activedescendant')).toBe('search-suggestion-0');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(navigate).toHaveBeenCalledWith(['/products', 'electronics', 'electronics-1']);
  });

  it('exposes an accessible mobile-menu state', () => {
    const fixture = TestBed.createComponent(AppHeader);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      '[aria-controls="mobile-navigation"]',
    ) as HTMLButtonElement;

    expect(button.getAttribute('aria-expanded')).toBe('false');
    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-expanded')).toBe('true');
    const mobileNavigation = fixture.nativeElement.querySelector(
      '#mobile-navigation',
    ) as HTMLElement;
    expect(mobileNavigation).toBeTruthy();
    expect(mobileNavigation.textContent).not.toContain('All categories');
    expect(mobileNavigation.textContent).not.toContain('Electronics');
    expect(mobileNavigation.textContent).toContain('Favourites');
    expect(mobileNavigation.textContent).toContain('theme');
  });
});
