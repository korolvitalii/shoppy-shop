import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

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
    expect(navigation.querySelector('a[href="/products"]')?.textContent).toContain('Products');
    expect(navigation.querySelector('a[href="/basket"]')?.textContent).toContain('3');
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
