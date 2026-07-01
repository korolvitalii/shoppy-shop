import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { BasketService } from '../../features/basket/data-access/basket.service';
import { AppHeader } from './app-header';

describe('AppHeader', () => {
  const basket = { itemCount: signal(3) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppHeader],
      providers: [provideRouter([]), { provide: BasketService, useValue: basket }],
    }).compileComponents();
  });

  it('provides primary navigation and the current basket count', () => {
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

  it('renders a distinctive brand mark and an accessible product search', () => {
    const fixture = TestBed.createComponent(AppHeader);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[aria-label="ShoppyShop home"] svg')).toBeTruthy();
    expect(element.querySelector('form[role="search"]')).toBeTruthy();
    expect(element.querySelector('input[type="search"]')?.getAttribute('placeholder')).toBe(
      'Search products, brands and more',
    );
    expect(element.querySelectorAll('select option')).toHaveLength(7);
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
    expect(fixture.nativeElement.querySelector('#mobile-navigation')).toBeTruthy();
  });
});
