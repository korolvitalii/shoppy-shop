import { ApplicationRef, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { PrerenderSnapshot } from './prerender-snapshot';

describe('PrerenderSnapshot', () => {
  const key = makeStateKey<string>('greeting');

  describe('in the browser', () => {
    // Created inside each test and used straight away, as a hydrating page does: the snapshot is
    // only served until the app first settles, which happens as soon as the test yields.
    const hydrate = (recorded?: string) => {
      const transferState = TestBed.inject(TransferState);
      if (recorded !== undefined) transferState.set(key, recorded);
      return { transferState, snapshot: TestBed.inject(PrerenderSnapshot) };
    };

    it('serves the prerendered value at once, then revalidates it silently', () => {
      const { snapshot } = hydrate('prerendered');
      const live = new Subject<string>();
      const request = vi.fn(() => live);
      const values: string[] = [];

      snapshot.revalidate('greeting', request).subscribe((value) => values.push(value));

      expect(values).toEqual(['prerendered']);
      expect(request).toHaveBeenCalledExactlyOnceWith(true);

      live.next('live');
      expect(values).toEqual(['prerendered', 'live']);
    });

    it('serves a snapshot only once', () => {
      const { snapshot } = hydrate('prerendered');
      snapshot.revalidate('greeting', () => of('live')).subscribe();
      const request = vi.fn(() => of('live'));
      const values: string[] = [];

      snapshot.revalidate('greeting', request).subscribe((value) => values.push(value));

      expect(values).toEqual(['live']);
      expect(request).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('keeps the snapshot standing when revalidating fails', () => {
      const { snapshot } = hydrate('prerendered');
      const values: string[] = [];
      let failed = false;
      let completed = false;

      snapshot
        .revalidate('greeting', () => throwError(() => new Error('API unavailable')))
        .subscribe({
          next: (value) => values.push(value),
          error: () => (failed = true),
          complete: () => (completed = true),
        });

      expect(values).toEqual(['prerendered']);
      expect(failed).toBe(false);
      expect(completed).toBe(true);
    });

    it('is just the request, errors included, when nothing was prerendered', () => {
      const { snapshot } = hydrate();
      const request = vi.fn(() => throwError(() => new Error('API unavailable')));
      let failed = false;

      snapshot.revalidate('greeting', request).subscribe({ error: () => (failed = true) });

      expect(request).toHaveBeenCalledExactlyOnceWith(false);
      expect(failed).toBe(true);
    });

    it('reads the snapshot on subscription, not when the observable is created', () => {
      const { snapshot, transferState } = hydrate();
      const revalidated = snapshot.revalidate('greeting', () => of('live'));
      transferState.set(key, 'prerendered');
      const values: string[] = [];

      revalidated.subscribe((value) => values.push(value));

      expect(values).toEqual(['prerendered', 'live']);
    });

    it('stops serving snapshots once the page has hydrated', async () => {
      const { snapshot } = hydrate('prerendered');
      await TestBed.inject(ApplicationRef).whenStable();
      const values: string[] = [];

      snapshot.revalidate('greeting', () => of('live')).subscribe((value) => values.push(value));

      expect(values).toEqual(['live']);
    });

    it('records nothing', () => {
      const { snapshot, transferState } = hydrate();

      snapshot.record('greeting', 'rendered');

      expect(transferState.hasKey(key)).toBe(false);
    });
  });

  describe('on the server', () => {
    it('records the values a page is rendered from', () => {
      TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });

      TestBed.inject(PrerenderSnapshot).record('greeting', 'rendered');

      expect(TestBed.inject(TransferState).get(key, null)).toBe('rendered');
    });
  });
});
