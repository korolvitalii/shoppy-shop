import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  type ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { apiErrorInterceptor } from './core/errors/api-error.interceptor';
import { GlobalErrorHandler } from './core/errors/global-error.handler';
import { loadingInterceptor } from './core/loading/loading.interceptor';
import {
  ApiProductsRepository,
  ProductsRepository,
} from './features/catalogue/data-access/products.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([loadingInterceptor, apiErrorInterceptor])),
    provideRouter(routes),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: ProductsRepository, useClass: ApiProductsRepository },
  ],
};
