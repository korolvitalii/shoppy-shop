import { isPlatformBrowser } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  type ApplicationConfig,
  ErrorHandler,
  inject,
  PLATFORM_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { catchError, of, tap } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { apiErrorInterceptor } from './core/errors/api-error.interceptor';
import { GlobalErrorHandler } from './core/errors/global-error.handler';
import { loadingInterceptor } from './core/loading/loading.interceptor';
import { AuthenticationService } from './features/auth/data-access/authentication.service';
import { AuthenticationSessionService } from './features/auth/data-access/authentication-session.service';
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
    provideHttpClient(
      withFetch(),
      withInterceptors([loadingInterceptor, apiErrorInterceptor, authInterceptor]),
    ),
    provideRouter(routes),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: ProductGroupsRepository, useClass: ApiProductGroupsRepository },
    { provide: ProductsRepository, useClass: ApiProductsRepository },
    provideAppInitializer(() => {
      if (!isPlatformBrowser(inject(PLATFORM_ID))) return of(null);

      const authService = inject(AuthenticationService);
      const session = inject(AuthenticationSessionService);
      return authService.refresh().pipe(
        tap((result) => session.start(result)),
        catchError(() => of(null)),
      );
    }),
  ],
};
