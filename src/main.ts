import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';
import { LOCALE_ID } from '@angular/core';
import { loadTranslations } from '@angular/localize';
import { bootstrapApplication } from '@angular/platform-browser';

import { LOCALE_RELOAD_EVENT, resolveLocale } from './app/core/locale/locale.service';
import polishMessages from './locale/messages.pl.json';

function preferredLocale() {
  try {
    return resolveLocale(localStorage.getItem('shoppyshop.locale.v1'));
  } catch {
    return resolveLocale(null);
  }
}

const locale = preferredLocale();
document.documentElement.lang = locale;

if (locale === 'pl') {
  registerLocaleData(localePl);
  loadTranslations(polishMessages.translations);
}

async function enableApiMocking(): Promise<void> {
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });

  window.addEventListener(
    LOCALE_RELOAD_EVENT,
    (event) => {
      event.preventDefault();
      worker.stop();
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(
            registrations
              .filter((registration) =>
                [registration.active, registration.waiting, registration.installing].some(
                  (serviceWorker) => serviceWorker?.scriptURL.endsWith('/mockServiceWorker.js'),
                ),
              )
              .map((registration) => registration.unregister()),
          ),
        )
        .finally(() => window.location.reload());
    },
    { once: true },
  );
}

Promise.all([enableApiMocking(), import('./app/app'), import('./app/app.config')])
  .then(([, { App }, { appConfig }]) =>
    bootstrapApplication(App, {
      ...appConfig,
      providers: [...appConfig.providers, { provide: LOCALE_ID, useValue: locale }],
    }),
  )
  .catch((error: unknown) => console.error(error));
