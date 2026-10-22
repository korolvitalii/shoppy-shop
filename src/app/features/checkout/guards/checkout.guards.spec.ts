import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  provideRouter,
  Router,
  type RouterStateSnapshot,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { BasketService } from '../../basket/public-api';
import { CheckoutFacade } from '../data-access/checkout.facade';
import {
  basketRequiredGuard,
  deliveryRequiredGuard,
  paymentRequiredGuard,
} from './checkout.guards';

@Component({ template: '<main>Test page</main>' })
class TestPage {}

const routes = [
  { path: 'basket', component: TestPage },
  { path: 'public', component: TestPage },
  {
    path: 'checkout',
    canActivateChild: [basketRequiredGuard],
    children: [
      { path: 'delivery', component: TestPage },
      { path: 'payment', component: TestPage, canActivate: [deliveryRequiredGuard] },
      {
        path: 'review',
        component: TestPage,
        canActivate: [deliveryRequiredGuard, paymentRequiredGuard],
      },
    ],
  },
];

describe('basketRequiredGuard readiness', () => {
  let finishRestore: () => void;
  let itemCount: ReturnType<typeof signal<number>>;

  beforeEach(() => {
    itemCount = signal(0);
    const restored = new Promise<void>((resolve) => (finishRestore = resolve));
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: BasketService, useValue: { restored, itemCount } },
      ],
    });
  });

  function checkBasket() {
    return TestBed.runInInjectionContext(() =>
      basketRequiredGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  it('waits for restoration and then reads the current item count', async () => {
    let settled = false;
    const result = Promise.resolve(checkBasket()).then((value) => {
      settled = true;
      return value;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    itemCount.set(2);
    finishRestore();
    expect(await result).toBe(true);
  });

  it('redirects to the basket after an empty restoration', async () => {
    const result = checkBasket();
    finishRestore();
    expect(await result).toEqual(TestBed.inject(Router).parseUrl('/basket'));
  });

  it('does not redirect a newer navigation when restoration finishes', async () => {
    const harness = await RouterTestingHarness.create();
    const router = TestBed.inject(Router);
    const navigation = router.navigateByUrl('/checkout/delivery');
    await Promise.resolve();
    await harness.navigateByUrl('/public');
    finishRestore();
    expect(await navigation).toBe(false);
    expect(router.url).toBe('/public');
  });
});

describe('checkout navigation with persisted basket items', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: CheckoutFacade, useValue: { delivery: () => null, paymentToken: () => null } },
      ],
    });
  });

  afterEach(() => localStorage.clear());

  it.each(['/checkout/delivery', '/checkout/payment', '/checkout/review'])(
    'restores real stored items before navigating to %s',
    async (url) => {
      localStorage.setItem(
        'shoppyshop.basket.v1',
        JSON.stringify([
          {
            productId: 'beauty-1',
            groupId: 'beauty',
            name: 'Test product',
            imageUrl: '/test.jpg',
            unitPrice: 24,
            quantity: 2,
          },
        ]),
      );
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(url);
      expect(TestBed.inject(Router).url).toBe('/checkout/delivery');
      expect(TestBed.inject(BasketService).itemCount()).toBe(2);
    },
  );

  it.each([null, '{', '[{"quantity":-1}]'])(
    'redirects an empty or invalid saved basket: %s',
    async (stored) => {
      if (stored !== null) localStorage.setItem('shoppyshop.basket.v1', stored);
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/checkout/delivery');
      expect(TestBed.inject(Router).url).toBe('/basket');
    },
  );
});
