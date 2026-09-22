import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { ProductGroupsRepository } from '../../../catalogue/public-api';
import { OrdersRepository } from '../../data-access/orders.repository';
import { type Order } from '../../models/order.models';
import { OrderHistoryPage } from './order-history-page';

describe('OrderHistoryPage', () => {
  const repository = { getOrders: vi.fn() };
  const groupsRepository = { getAll: vi.fn() };
  let response: Subject<readonly Order[]>;

  beforeEach(async () => {
    response = new Subject<readonly Order[]>();
    repository.getOrders.mockReset();
    repository.getOrders.mockReturnValue(response);
    groupsRepository.getAll.mockReset();
    groupsRepository.getAll.mockReturnValue(of([{ id: 'electronics', name: 'Electronics' }]));

    await TestBed.configureTestingModule({
      imports: [OrderHistoryPage],
      providers: [
        provideRouter([]),
        { provide: OrdersRepository, useValue: repository },
        { provide: ProductGroupsRepository, useValue: groupsRepository },
      ],
    }).compileComponents();
  });

  it('shows loading and renders purchases returned by the API', () => {
    const fixture = TestBed.createComponent(OrderHistoryPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Loading purchases',
    );

    response.next([createOrder()]);
    response.complete();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('ORD-00003');
    expect(element.textContent).toContain('Studio headphones');
    expect(element.textContent).toContain('£204.99');
    expect(element.textContent).toContain('Visa ending in 4242');
    expect(element.textContent).toContain('Electronics');
    expect(element.querySelectorAll('article')).toHaveLength(1);
  });

  it('summarises the orders and survives a failed category lookup', () => {
    groupsRepository.getAll.mockReturnValue(throwError(() => new Error('Unavailable')));
    const fixture = TestBed.createComponent(OrderHistoryPage);
    fixture.detectChanges();
    response.next([
      createOrder({ id: 'ORD-00010', createdAt: today(), total: 50 }),
      createOrder({ id: 'ORD-00011', createdAt: lastYear(), total: 25 }),
    ]);
    response.complete();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    // Orders, spent this year (the older one falls outside it), in transit, returns open.
    expect(summaryOf(element)).toEqual(['2', '£50.00', '1', '0']);
    expect(element.textContent).toContain('Showing 2 of 2 orders');
    // The ledger still renders; only the category eyebrow is missing.
    expect(element.querySelectorAll('article')).toHaveLength(2);
    expect(element.querySelector('.line-category')).toBeNull();
  });

  it('filters the ledger by delivery stage', () => {
    const fixture = TestBed.createComponent(OrderHistoryPage);
    fixture.detectChanges();
    response.next([
      createOrder({ id: 'ORD-00010', createdAt: today() }),
      createOrder({ id: 'ORD-00011', createdAt: lastYear() }),
    ]);
    response.complete();
    fixture.detectChanges();

    clickTag(fixture.nativeElement as HTMLElement, 'Delivered');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('ORD-00011');
    expect(element.textContent).not.toContain('ORD-00010');
    expect(element.textContent).toContain('Showing 1 of 1 order');

    // A tag that matches nothing must say so rather than leave the ledger blank.
    clickTag(element, 'Returns');
    fixture.detectChanges();
    expect(element.textContent).toContain('Nothing under this filter');
  });

  it('hands focus to the All tag when the empty filter is cleared', () => {
    const fixture = TestBed.createComponent(OrderHistoryPage);
    fixture.detectChanges();
    response.next([createOrder({ createdAt: today() })]);
    response.complete();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    clickTag(element, 'Returns');
    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>('.state--empty .action')!.click();
    fixture.detectChanges();

    // That button unmounts with the empty state it lived in, so focus has to be put somewhere
    // that survives — otherwise the keyboard user is dropped back at the top of the document.
    expect(element.textContent).toContain('ORD-00003');
    expect(document.activeElement).toBe(element.querySelector('.filter-tags .tag'));
  });

  it('reveals earlier orders a page at a time', () => {
    const fixture = TestBed.createComponent(OrderHistoryPage);
    fixture.detectChanges();
    response.next(Array.from({ length: 7 }, (_, index) => createOrder({ id: `ORD-0001${index}` })));
    response.complete();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const reveal = () => element.querySelector<HTMLButtonElement>('.show-earlier');
    expect(element.querySelectorAll('article')).toHaveLength(5);
    expect(element.textContent).toContain('Showing 5 of 7 orders');

    reveal()!.click();
    fixture.detectChanges();

    expect(element.querySelectorAll('article')).toHaveLength(7);
    // The control stays put once everything is out — removing it would drop the focus that is
    // sitting on it — and a second click must not keep growing the count.
    expect(reveal()?.getAttribute('aria-disabled')).toBe('true');
    reveal()!.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('article')).toHaveLength(7);
  });

  it('seeks a further server page once every locally-loaded order is revealed', () => {
    const fixture = TestBed.createComponent(OrderHistoryPage);
    fixture.detectChanges();
    const firstPage = Array.from({ length: 50 }, (_, index) =>
      createOrder({ id: `ORD-${String(index).padStart(5, '0')}`, createdAt: today() }),
    );
    response.next(firstPage);
    response.complete();
    fixture.detectChanges();

    const secondResponse = new Subject<readonly Order[]>();
    repository.getOrders.mockReturnValueOnce(secondResponse);

    const element = fixture.nativeElement as HTMLElement;
    const reveal = () => element.querySelector<HTMLButtonElement>('.show-earlier');

    // A full page (50) doesn't mean history ends there — each of these clicks reveals orders
    // already loaded, so none of them should touch the network.
    for (let shown = 5; shown < 50; shown += 5) {
      reveal()!.click();
      fixture.detectChanges();
    }
    expect(element.querySelectorAll('article')).toHaveLength(50);
    expect(repository.getOrders).toHaveBeenCalledTimes(1);

    // Nothing local left to reveal, and the last page came back full - the next click has to ask
    // the server for more, seeked from the last loaded order rather than restarting from the top.
    reveal()!.click();
    fixture.detectChanges();
    expect(repository.getOrders).toHaveBeenCalledTimes(2);
    expect(repository.getOrders).toHaveBeenLastCalledWith({
      before: firstPage[49].createdAt,
      beforeId: firstPage[49].id,
    });

    secondResponse.next([createOrder({ id: 'ORD-00099', createdAt: today() })]);
    secondResponse.complete();
    fixture.detectChanges();

    expect(element.querySelectorAll('article')).toHaveLength(51);
    expect(element.textContent).toContain('ORD-00099');
    // That second page came back short, so this really was the end of the account's history.
    expect(reveal()?.getAttribute('aria-disabled')).toBe('true');
  });

  it('keeps pagination reachable when the loaded page has no matches for the filter', () => {
    const fixture = TestBed.createComponent(OrderHistoryPage);
    fixture.detectChanges();
    const firstPage = Array.from({ length: 50 }, (_, index) =>
      createOrder({ id: `ORD-${String(index).padStart(5, '0')}`, createdAt: today() }),
    );
    response.next(firstPage);
    response.complete();
    fixture.detectChanges();

    const secondResponse = new Subject<readonly Order[]>();
    repository.getOrders.mockReturnValueOnce(secondResponse);

    const element = fixture.nativeElement as HTMLElement;
    clickTag(element, 'Delivered');
    fixture.detectChanges();

    // None of the 50 loaded orders are delivered yet, but the server hasn't confirmed history
    // ends there - the reveal control has to stay reachable rather than being hidden behind the
    // "nothing under this filter" empty state, or older delivered orders become unreachable.
    expect(element.textContent).toContain('Nothing under this filter');
    const reveal = element.querySelector<HTMLButtonElement>('.show-earlier');
    expect(reveal).not.toBeNull();
    expect(reveal?.getAttribute('aria-disabled')).toBeNull();

    reveal!.focus();
    reveal!.click();
    fixture.detectChanges();
    expect(repository.getOrders).toHaveBeenCalledTimes(2);
    expect(repository.getOrders).toHaveBeenLastCalledWith({
      before: firstPage[49].createdAt,
      beforeId: firstPage[49].id,
    });

    secondResponse.next([createOrder({ id: 'ORD-00099', createdAt: lastYear() })]);
    secondResponse.complete();
    fixture.detectChanges();

    expect(element.textContent).not.toContain('Nothing under this filter');
    expect(element.textContent).toContain('ORD-00099');

    // That one delivered order is the only match and the server confirmed history ends there, so
    // the button has nothing left to do - but it must stay put rather than unmount, or the
    // keyboard focus it held would be dropped back at the top of the document.
    const revealAfter = element.querySelector<HTMLButtonElement>('.show-earlier');
    expect(revealAfter).toBe(reveal);
    expect(document.activeElement).toBe(revealAfter);
    expect(revealAfter?.getAttribute('aria-disabled')).toBe('true');
  });

  it('leaves the reveal control out when one page holds every order', () => {
    const fixture = TestBed.createComponent(OrderHistoryPage);
    fixture.detectChanges();
    response.next([createOrder()]);
    response.complete();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.show-earlier')).toBeNull();
  });

  it('asks the catalogue for categories without raising the global error banner', () => {
    const fixture = TestBed.createComponent(OrderHistoryPage);
    fixture.detectChanges();

    // The component's own catchError runs after the interceptors, so the request itself has to
    // opt out of the global banner and loading bar.
    expect(groupsRepository.getAll).toHaveBeenCalledWith({ silent: true });
  });

  it('provides an empty state when the customer has no purchases', () => {
    const fixture = TestBed.createComponent(OrderHistoryPage);
    fixture.detectChanges();
    response.next([]);
    response.complete();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No purchases yet');
    expect(fixture.nativeElement.querySelector('a[href="/products"]')).toBeTruthy();
  });

  it('announces request failures and retries', () => {
    const retryResponse = new Subject<readonly Order[]>();
    repository.getOrders.mockReturnValueOnce(response).mockReturnValueOnce(retryResponse);
    const fixture = TestBed.createComponent(OrderHistoryPage);
    fixture.detectChanges();
    response.error(new Error('Unavailable'));
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('We could not load your purchases');
    (alert.querySelector('button') as HTMLButtonElement).click();
    expect(repository.getOrders).toHaveBeenCalledTimes(2);
  });
});

/**
 * Stage and "spent this year" both depend on the clock, so the fixtures are anchored to it: an
 * order placed right now is always still on its way and always inside the current year, and one
 * from last June is always delivered with its returns window long shut.
 */
function today(): string {
  return new Date().toISOString();
}

function lastYear(): string {
  return new Date(Date.UTC(new Date().getUTCFullYear() - 1, 5, 1, 12)).toISOString();
}

function summaryOf(element: HTMLElement): string[] {
  return [...element.querySelectorAll('.summary-value')].map((cell) =>
    (cell.textContent ?? '').trim(),
  );
}

function clickTag(element: HTMLElement, label: string): void {
  const tag = [...element.querySelectorAll<HTMLButtonElement>('.filter-tags .tag')].find(
    (button) => button.textContent?.trim() === label,
  );
  if (!tag) throw new Error(`No "${label}" filter tag rendered`);
  tag.click();
}

function createOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ORD-00003',
    createdAt: '2026-06-28T14:20:00.000Z',
    status: 'confirmed',
    lines: [
      {
        productId: 'electronics-1',
        groupId: 'electronics',
        name: 'Studio headphones',
        imageUrl: '/headphones.jpg',
        unitPrice: 200,
        quantity: 1,
      },
    ],
    delivery: {
      name: 'Demo Customer',
      email: 'demo@shoppyshop.test',
      address: '10 Market Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'United Kingdom',
    },
    deliveryMethod: 'standard',
    paymentToken: { tokenId: 'tok_demo', brand: 'Visa', last4: '4242' },
    subtotal: 200,
    deliveryCharge: 4.99,
    total: 204.99,
    ...overrides,
  };
}
