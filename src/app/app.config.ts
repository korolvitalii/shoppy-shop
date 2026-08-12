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
import { ConfigService } from './core/config/config.service';
import { apiErrorInterceptor } from './core/errors/api-error.interceptor';
import { GlobalErrorHandler } from './core/errors/global-error.handler';
import { loadingInterceptor } from './core/loading/loading.interceptor';
import {
  AuthenticationService,
  AuthenticationSessionService,
  authInterceptor,
} from './features/auth/public-api';
import {
  ApiProductGroupsRepository,
  ApiProductsRepository,
  ProductGroupsRepository,
  ProductsRepository,
} from './features/catalogue/public-api';

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
    provideAppInitializer(() => {
      if (!isPlatformBrowser(inject(PLATFORM_ID))) return of(null);

      return inject(ConfigService).load();
    }),
  ],
};
