import { DOCUMENT } from '@angular/common';
import { inject, Injectable, LOCALE_ID } from '@angular/core';

import { getLocaleDefinition, type SupportedLocale, supportedLocales } from './locale.config';

export type { SupportedLocale } from './locale.config';

export function localizedPath(pathname: string, locale: SupportedLocale): string {
  const segments = pathname.split('/').filter(Boolean);
  if (supportedLocales.some((candidate) => candidate.path === segments[0])) segments.shift();
  return `/${getLocaleDefinition(locale).path}/${segments.join('/')}`.replace(/\/$/, '');
}

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly document = inject(DOCUMENT);
  readonly currentLocale = inject(LOCALE_ID) as SupportedLocale;

  switchTo(locale: SupportedLocale): void {
    if (locale === this.currentLocale) return;
    const view = this.document.defaultView;
    if (!view) return;
    const path = localizedPath(view.location.pathname, locale);
    const localePath = getLocaleDefinition(locale).path;
    view.location.assign(`${path || `/${localePath}`}${view.location.search}${view.location.hash}`);
  }
}
