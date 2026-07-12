import { DOCUMENT } from '@angular/common';
import { inject, Injectable, LOCALE_ID } from '@angular/core';

export type SupportedLocale = 'en-GB' | 'pl';

const STORAGE_KEY = 'shoppyshop.locale.v1';
export const LOCALE_RELOAD_EVENT = 'shoppyshop:locale-reload';

export function resolveLocale(value: string | null): SupportedLocale {
  return value === 'pl' ? 'pl' : 'en-GB';
}

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly document = inject(DOCUMENT);
  readonly currentLocale = inject(LOCALE_ID) as SupportedLocale;

  switchTo(locale: SupportedLocale): void {
    if (locale === this.currentLocale) return;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Navigation still works when storage is unavailable.
    }

    const view = this.document.defaultView;
    if (!view) return;

    const reloadEvent = new view.Event(LOCALE_RELOAD_EVENT, { cancelable: true });
    if (view.dispatchEvent(reloadEvent)) {
      view.location.reload();
    }
  }
}
