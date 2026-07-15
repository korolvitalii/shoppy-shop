import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthenticationSessionService } from '../../features/auth/data-access/authentication-session.service';
import { BasketService } from '../../features/basket/data-access/basket.service';
import { MobileNavigation } from './mobile-navigation';

describe('MobileNavigation', () => {
  const authenticated = signal(false);

  beforeEach(() => authenticated.set(false));

  async function configure(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [MobileNavigation],
      providers: [
        provideRouter([]),
        { provide: BasketService, useValue: { itemCount: signal(2) } },
        {
          provide: AuthenticationSessionService,
          useValue: { isAuthenticated: authenticated },
        },
      ],
    }).compileComponents();
  }

  it('shows customer tabs and the basket count when authenticated', async () => {
    authenticated.set(true);
    await configure();
    const fixture = TestBed.createComponent(MobileNavigation);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('nav[aria-label="Mobile primary navigation"]')).toBeTruthy();
    expect(element.querySelector('a[href="/products"]')?.textContent).toContain('Shop');
    expect(element.querySelector('a[href="/basket"]')?.textContent).toContain('2');
    expect(element.querySelectorAll('app-lucide-icon svg')).toHaveLength(4);
  });

  it('only shows the public shop tab while anonymous', async () => {
    await configure();
    const fixture = TestBed.createComponent(MobileNavigation);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('a[href="/products"]')).toBeTruthy();
    expect(element.querySelector('a[href="/orders"]')).toBeNull();
    expect(element.querySelector('a[href="/basket"]')).toBeNull();
  });
});
