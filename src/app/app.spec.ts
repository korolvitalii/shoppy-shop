import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { App } from './app';
import { ConfigService } from './core/config/config.service';
import { ProductsRepository } from './features/catalogue/data-access/products.repository';

@Component({ template: '<main><h1>Routed page</h1></main>' })
class RoutedPage {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([{ path: 'test-page', component: RoutedPage }]),
        { provide: ProductsRepository, useValue: { search: vi.fn(), getById: vi.fn() } },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should provide the application router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('keeps one routed main landmark and a focusable skip-link target', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/test-page');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('main')).toHaveLength(1);
    const target = element.querySelector<HTMLElement>('#main-content')!;
    expect(target.tagName).toBe('DIV');
    expect(target.tabIndex).toBe(-1);
    expect(element.querySelector('.skip-link')?.getAttribute('href')).toBe('#main-content');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    element.querySelector('.skip-link')!.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(target);
  });

  it('hides the assistant widget when the assistant feature is disabled', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: ProductsRepository, useValue: { search: vi.fn(), getById: vi.fn() } },
        { provide: ConfigService, useValue: { assistantEnabled: signal(false) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-assistant-widget')).toBeNull();
  });
});
