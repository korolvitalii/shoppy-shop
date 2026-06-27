import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { apiErrorInterceptor } from './core/errors/api-error.interceptor';
import { GlobalErrorHandler } from './core/errors/global-error.handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([apiErrorInterceptor])),
    provideRouter(routes),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
