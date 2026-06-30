import { TestBed } from '@angular/core/testing';

import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('delays the indicator to avoid flicker for fast work', () => {
    const service = TestBed.inject(LoadingService);

    service.start();
    expect(service.isLoading()).toBe(false);
    vi.advanceTimersByTime(199);
    expect(service.isLoading()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(service.isLoading()).toBe(true);

    service.stop();
    expect(service.isLoading()).toBe(false);
  });

  it('stays active until every concurrent operation finishes', () => {
    const service = TestBed.inject(LoadingService);

    service.start();
    service.start();
    vi.advanceTimersByTime(200);
    service.stop();
    expect(service.isLoading()).toBe(true);

    service.stop();
    expect(service.isLoading()).toBe(false);
  });

  it('never displays when an operation finishes inside the delay', () => {
    const service = TestBed.inject(LoadingService);

    service.start();
    service.stop();
    vi.advanceTimersByTime(200);

    expect(service.isLoading()).toBe(false);
  });
});
