import { Routes } from '@angular/router';

import {
  ApiProductGroupsRepository,
  ProductGroupsRepository,
} from './features/catalogue/data-access/product-groups.repository';
import {
  ApiProductsRepository,
  ProductsRepository,
} from './features/catalogue/data-access/products.repository';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in | ShoppyShop',
    loadComponent: () =>
      import('./features/auth/login-page/login-page').then(({ LoginPage }) => LoginPage),
  },
  {
    path: 'products',
    providers: [
      { provide: ProductGroupsRepository, useClass: ApiProductGroupsRepository },
      { provide: ProductsRepository, useClass: ApiProductsRepository },
    ],
    children: [
      {
        path: '',
        title: 'Products | ShoppyShop',
        loadComponent: () =>
          import('./features/catalogue/pages/product-groups-page/product-groups-page').then(
            ({ ProductGroupsPage }) => ProductGroupsPage,
          ),
      },
      {
        path: ':groupId',
        title: 'Collection | ShoppyShop',
        loadComponent: () =>
          import('./features/catalogue/pages/product-listing-page/product-listing-page').then(
            ({ ProductListingPage }) => ProductListingPage,
          ),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  { path: '**', redirectTo: 'login' },
];
