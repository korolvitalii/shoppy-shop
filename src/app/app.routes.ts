import { type Routes } from '@angular/router';

import { anonymousGuard, authenticationGuard } from './features/auth/guards/authentication.guard';
import { CheckoutFacade } from './features/checkout/data-access/checkout.facade';
import {
  ApiOrdersRepository,
  OrdersRepository,
} from './features/checkout/data-access/orders.repository';
import {
  basketRequiredGuard,
  deliveryRequiredGuard,
  paymentRequiredGuard,
} from './features/checkout/guards/checkout.guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [anonymousGuard],
    title: $localize`:@@signInTitle:Sign in | ShoppyShop`,
    loadComponent: () =>
      import('./features/auth/login-page/login-page').then(({ LoginPage }) => LoginPage),
  },
  {
    path: 'products',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/catalogue/pages/product-groups-page/product-groups-page').then(
            ({ ProductGroupsPage }) => ProductGroupsPage,
          ),
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./features/catalogue/pages/product-listing-page/product-listing-page').then(
            ({ ProductListingPage }) => ProductListingPage,
          ),
      },
      {
        path: ':groupId/:productId',
        loadComponent: () =>
          import('./features/catalogue/pages/product-details-page/product-details-page').then(
            ({ ProductDetailsPage }) => ProductDetailsPage,
          ),
      },
      {
        path: ':groupId',
        loadComponent: () =>
          import('./features/catalogue/pages/product-listing-page/product-listing-page').then(
            ({ ProductListingPage }) => ProductListingPage,
          ),
      },
    ],
  },
  {
    path: 'favorites',
    title: $localize`:@@favouritesTitle:My favourites | ShoppyShop`,
    loadComponent: () =>
      import('./features/favorites/pages/favorites-page/favorites-page').then(
        ({ FavoritesPage }) => FavoritesPage,
      ),
  },
  {
    path: 'basket',
    canActivate: [authenticationGuard],
    title: $localize`:@@basketTitle:Basket | ShoppyShop`,
    loadComponent: () =>
      import('./features/basket/pages/basket-page/basket-page').then(
        ({ BasketPage }) => BasketPage,
      ),
  },
  {
    path: 'checkout',
    canActivate: [authenticationGuard],
    canActivateChild: [basketRequiredGuard],
    providers: [CheckoutFacade, { provide: OrdersRepository, useClass: ApiOrdersRepository }],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'delivery' },
      {
        path: 'delivery',
        loadComponent: () =>
          import('./features/checkout/pages/delivery-page/delivery-page').then(
            (m) => m.DeliveryPage,
          ),
      },
      {
        path: 'payment',
        canActivate: [deliveryRequiredGuard],
        loadComponent: () =>
          import('./features/checkout/pages/payment-page/payment-page').then((m) => m.PaymentPage),
      },
      {
        path: 'review',
        canActivate: [deliveryRequiredGuard, paymentRequiredGuard],
        loadComponent: () =>
          import('./features/checkout/pages/review-page/review-page').then((m) => m.ReviewPage),
      },
    ],
  },
  {
    path: 'orders',
    canActivate: [authenticationGuard],
    title: $localize`:@@purchaseHistoryTitle:Purchase history | ShoppyShop`,
    providers: [{ provide: OrdersRepository, useClass: ApiOrdersRepository }],
    loadComponent: () =>
      import('./features/orders/pages/order-history-page/order-history-page').then(
        ({ OrderHistoryPage }) => OrderHistoryPage,
      ),
  },
  {
    path: 'orders/:orderId/confirmation',
    canActivate: [authenticationGuard],
    providers: [{ provide: OrdersRepository, useClass: ApiOrdersRepository }],
    loadComponent: () =>
      import('./features/checkout/pages/order-confirmation-page/order-confirmation-page').then(
        (m) => m.OrderConfirmationPage,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  { path: '**', redirectTo: 'products' },
];
