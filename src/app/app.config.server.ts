import { type ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import {
  ProductGroupsRepository,
  StaticProductGroupsRepository,
} from './features/catalogue/data-access/product-groups.repository';
import {
  ProductsRepository,
  StaticProductsRepository,
} from './features/catalogue/data-access/products.repository';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: ProductGroupsRepository, useClass: StaticProductGroupsRepository },
    { provide: ProductsRepository, useClass: StaticProductsRepository },
  ],
};

export default mergeApplicationConfig(appConfig, serverConfig);
