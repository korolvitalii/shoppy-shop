import { estimateArrivalWindow } from './delivery-estimate';

const days = (createdAt: string) =>
  estimateArrivalWindow(createdAt)?.map((date) => date.getUTCDate());

describe('estimateArrivalWindow', () => {
  it('estimates arrival as 3-5 working days, skipping weekends', () => {
    // Friday: the three-day window steps over the weekend to Wed, the five-day one to Fri.
    expect(days('2026-07-03T12:00:00Z')).toEqual([8, 10]);
    // Monday: no weekend inside the three-day window, one inside the five-day window.
    expect(days('2026-07-06T12:00:00Z')).toEqual([9, 13]);
    // Saturday: nothing is picked until Monday, so the count starts there.
    expect(days('2026-07-04T12:00:00Z')).toEqual([9, 13]);
    expect(days('2026-07-05T12:00:00Z')).toEqual([9, 13]);
  });

  it('reads the order date in UTC rather than the viewer timezone', () => {
    // 00:30 UTC on Monday is still Sunday for anyone behind UTC; reading it locally
    // would start the count a day early.
    expect(days('2026-07-06T00:30:00Z')).toEqual([9, 13]);
    expect(days('2026-07-03T23:30:00Z')).toEqual([8, 10]);
  });

  it('returns null for a missing or unparseable order date', () => {
    expect(estimateArrivalWindow('')).toBeNull();
    expect(estimateArrivalWindow('not-a-date')).toBeNull();
    expect(estimateArrivalWindow(undefined)).toBeNull();
    expect(estimateArrivalWindow(null)).toBeNull();
  });
});
