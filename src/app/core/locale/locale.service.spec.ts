import { DOCUMENT } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { supportedLocales } from './locale.config';
import { LocaleService, localizedPath } from './locale.service';

describe('LocaleService', () => {
  it('reads the locale selected by the localized build', () => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'pl' }] });
    expect(TestBed.inject(LocaleService).currentLocale).toBe('pl');
    expect(TestBed.inject(DOCUMENT).documentElement).toBeTruthy();
  });

  it('preserves the catalogue route when changing locale', () => {
    expect(localizedPath('/en/products/home/home-2', 'pl')).toBe('/pl/products/home/home-2');
    expect(localizedPath('/pl/products', 'en-GB')).toBe('/en/products');
  });

  it('keeps locale paths unique and declares exactly one default', () => {
    expect(new Set(supportedLocales.map((locale) => locale.path)).size).toBe(
      supportedLocales.length,
    );
    expect(supportedLocales.filter((locale) => locale.default)).toHaveLength(1);
  });
});
