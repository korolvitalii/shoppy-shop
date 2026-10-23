import { type ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { ProductGroupsRepository } from './features/catalogue/data-access/product-groups.repository';
import { ProductsRepository } from './features/catalogue/data-access/products.repository';
// Imported here only, never through the catalogue public API: these bring the full catalogue and
// its translations, which belong in the server bundle alone.
import { StaticProductGroupsRepository } from './features/catalogue/data-access/static-product-groups.repository';
import { StaticProductsRepository } from './features/catalogue/data-access/static-products.repository';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: ProductGroupsRepository, useClass: StaticProductGroupsRepository },
    { provide: ProductsRepository, useClass: StaticProductsRepository },
  ],
};

export default mergeApplicationConfig(appConfig, serverConfig);
