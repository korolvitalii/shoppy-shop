import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  type ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { apiErrorInterceptor } from './core/errors/api-error.interceptor';
import { GlobalErrorHandler } from './core/errors/global-error.handler';
import { loadingInterceptor } from './core/loading/loading.interceptor';
import {
  ApiProductGroupsRepository,
  ProductGroupsRepository,
} from './features/catalogue/data-access/product-groups.repository';
import {
  ApiProductsRepository,
  ProductsRepository,
} from './features/catalogue/data-access/products.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([loadingInterceptor, apiErrorInterceptor])),
    provideRouter(routes),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: ProductGroupsRepository, useClass: ApiProductGroupsRepository },
    { provide: ProductsRepository, useClass: ApiProductsRepository },
  ],
};
