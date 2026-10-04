import { createDemoPaymentToken } from './payment-token';

describe('createDemoPaymentToken', () => {
  it('keeps only the brand and last four digits of a formatted card number', () => {
    const token = createDemoPaymentToken('4111 1111 1111 1234', 1_700_000_000_000);

    expect(token).toEqual({ tokenId: 'tok_1700000000000', brand: 'Visa', last4: '1234' });
    expect(JSON.stringify(token)).not.toContain('4111');
  });

  it('labels cards outside the Visa range generically', () => {
    expect(createDemoPaymentToken('5555555555554444').brand).toBe('Card');
  });
});
