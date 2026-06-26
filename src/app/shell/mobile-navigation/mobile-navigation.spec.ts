import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BasketService } from '../../features/basket/data-access/basket.service';
import { MobileNavigation } from './mobile-navigation';

describe('MobileNavigation', () => {
  it('shows mobile route tabs and the basket count', async () => {
    await TestBed.configureTestingModule({
      imports: [MobileNavigation],
      providers: [
        provideRouter([]),
        { provide: BasketService, useValue: { itemCount: signal(2) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(MobileNavigation);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('nav[aria-label="Mobile primary navigation"]')).toBeTruthy();
    expect(element.querySelector('a[href="/products"]')?.textContent).toContain('Shop');
    expect(element.querySelector('a[href="/basket"]')?.textContent).toContain('2');
  });
});
