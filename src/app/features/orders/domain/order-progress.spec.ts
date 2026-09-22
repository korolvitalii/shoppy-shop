import { deriveOrderProgress, matchesFilter, type OrderProgress } from './order-progress';

// Monday 6 July 2026. The 3-5 working day promise puts arrival between Thu 9 and Mon 13 July.
// Returns run 30 days from the *earliest* of those, so the window shuts on 8 August.
const PLACED = '2026-07-06T09:00:00Z';
const at = (day: string) => deriveOrderProgress(PLACED, new Date(day));

describe('deriveOrderProgress', () => {
  it('keeps an order in packing until the arrival window opens', () => {
    expect(at('2026-07-06T23:00:00Z').stage).toBe('packing');
    expect(at('2026-07-08T12:00:00Z').stage).toBe('packing');
  });

  it('counts the whole first and last promised day as in transit', () => {
    // The window is built at noon, so a morning visit on the opening day must not still say
    // "packing" and an evening visit on the closing day must not already say "delivered".
    expect(at('2026-07-09T00:30:00Z').stage).toBe('in-transit');
    expect(at('2026-07-13T23:30:00Z').stage).toBe('in-transit');
  });

  it('treats the order as delivered once the window has passed, and opens returns', () => {
    const progress = at('2026-07-14T09:00:00Z');
    expect(progress.stage).toBe('delivered');
    expect(progress.returnsClose?.toISOString()).toContain('2026-08-08');
  });

  it('closes the returns window 30 days after the earliest promised arrival', () => {
    expect(at('2026-08-08T09:00:00Z').returnsClose).not.toBeNull();
    expect(at('2026-08-09T09:00:00Z').returnsClose).toBeNull();
    expect(at('2026-08-09T09:00:00Z').stage).toBe('delivered');
  });

  it('holds an order with no usable date in packing rather than inventing a delivery', () => {
    const progress = deriveOrderProgress('not-a-date', new Date('2026-07-14T09:00:00Z'));
    expect(progress).toEqual({ stage: 'packing', arrival: null, returnsClose: null });
  });
});

describe('matchesFilter', () => {
  const packing: OrderProgress = { stage: 'packing', arrival: null, returnsClose: null };
  const shipped: OrderProgress = { stage: 'in-transit', arrival: null, returnsClose: null };
  const returnable: OrderProgress = {
    stage: 'delivered',
    arrival: null,
    returnsClose: new Date('2026-08-12T12:00:00Z'),
  };
  const settled: OrderProgress = { stage: 'delivered', arrival: null, returnsClose: null };

  it('keeps every order under the "all" tag', () => {
    for (const progress of [packing, shipped, returnable, settled]) {
      expect(matchesFilter(progress, 'all')).toBe(true);
    }
  });

  it('reads "in transit" as everything not yet delivered', () => {
    expect(matchesFilter(packing, 'in-transit')).toBe(true);
    expect(matchesFilter(shipped, 'in-transit')).toBe(true);
    expect(matchesFilter(settled, 'in-transit')).toBe(false);
  });

  it('separates delivered orders from the ones still open for a return', () => {
    expect(matchesFilter(returnable, 'delivered')).toBe(true);
    expect(matchesFilter(settled, 'delivered')).toBe(true);
    expect(matchesFilter(returnable, 'returns')).toBe(true);
    expect(matchesFilter(settled, 'returns')).toBe(false);
    expect(matchesFilter(shipped, 'returns')).toBe(false);
  });
});
