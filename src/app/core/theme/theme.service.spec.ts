import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
  });

  it('applies and persists a selected theme', () => {
    const service = TestBed.inject(ThemeService);

    service.set('dark');

    expect(service.isDark()).toBe(true);
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('shoppyshop.theme.v1')).toBe('dark');
  });

  it('toggles between dark and light', () => {
    const service = TestBed.inject(ThemeService);
    service.set('light');

    service.toggle();
    expect(service.theme()).toBe('dark');

    service.toggle();
    expect(service.theme()).toBe('light');
  });
});
