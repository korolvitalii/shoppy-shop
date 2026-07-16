import { bootstrapApplication } from '@angular/platform-browser';

async function enableApiMocking(): Promise<void> {
  const { worker } = await import('./mocks/browser');
  const serviceWorkerUrl = new URL('mockServiceWorker.js', document.baseURI).pathname;
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: serviceWorkerUrl },
  });
}

Promise.all([enableApiMocking(), import('./app/app'), import('./app/app.config')])
  .then(([, { App }, { appConfig }]) => bootstrapApplication(App, appConfig))
  .catch((error: unknown) => console.error(error));
