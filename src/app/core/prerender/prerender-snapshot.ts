import { isPlatformServer } from '@angular/common';
import {
  ApplicationRef,
  inject,
  Injectable,
  makeStateKey,
  PLATFORM_ID,
  TransferState,
} from '@angular/core';
import { catchError, concat, defer, EMPTY, type Observable, of } from 'rxjs';

/**
 * Hands the data a page was prerendered from to the browser, so hydration resumes the page in the
 * state it was built in. Without it a page restarts from its loading state, which swaps the
 * prerendered markup for a spinner and back again once the live request lands.
 */
@Injectable({ providedIn: 'root' })
export class PrerenderSnapshot {
  private readonly transferState = inject(TransferState);
  private readonly server = isPlatformServer(inject(PLATFORM_ID));
  private hydrating = !this.server;

  constructor() {
    // A snapshot only describes the page that was prerendered. Once that page has hydrated, one
    // nobody asked for is build-time data and must not answer a later client-side navigation.
    if (this.hydrating) {
      void inject(ApplicationRef)
        .whenStable()
        .then(() => (this.hydrating = false));
    }
  }

  /** Stores a value the page is being rendered from. Only the server records; in the browser this is a no-op. */
  record<T>(key: string, value: T): void {
    if (this.server) this.transferState.set(makeStateKey<T>(key), value);
  }

  /**
   * While hydrating a page that recorded `key`, emits the recorded value at once and then the live
   * one, and serves that snapshot only once. Otherwise this is just `request(false)`.
   *
   * The live request is made with `silent` set: the snapshot is already on screen, so revalidating
   * it shouldn't raise the loading bar, and if it fails the snapshot stands rather than turning a
   * rendered page into an error.
   */
  revalidate<T>(key: string, request: (silent: boolean) => Observable<T>): Observable<T> {
    return defer(() => {
      const stateKey = makeStateKey<T>(key);
      if (!this.hydrating || !this.transferState.hasKey(stateKey)) return request(false);

      const snapshot = this.transferState.get(stateKey, null) as T;
      this.transferState.remove(stateKey);
      return concat(of(snapshot), request(true).pipe(catchError(() => EMPTY)));
    });
  }
}
