import { isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

async function enableApiMocking(): Promise<void> {
  if (!isDevMode()) {
    return;
  }

  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

enableApiMocking()
  .then(() => bootstrapApplication(App, appConfig))
  .catch((error: unknown) => console.error(error));
