import { resolveLocale } from './locale.service';

describe('resolveLocale', () => {
  it('restores Polish from the saved preference', () => {
    expect(resolveLocale('pl')).toBe('pl');
  });

  it('falls back to English for missing or unsupported values', () => {
    expect(resolveLocale(null)).toBe('en-GB');
    expect(resolveLocale('de')).toBe('en-GB');
  });
});
