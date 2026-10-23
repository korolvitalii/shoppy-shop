import { deliveryCountryLabel } from './delivery-countries';

describe('deliveryCountryLabel', () => {
  it('returns the label for a known country value', () => {
    expect(deliveryCountryLabel('United Kingdom')).toBe('United Kingdom');
  });

  it('preserves an unknown country value', () => {
    expect(deliveryCountryLabel('New Zealand')).toBe('New Zealand');
  });
});
