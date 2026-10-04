import { type CheckoutPaymentToken } from '../models/checkout.models';

/**
 * Stands in for a payment provider's tokenization. Only the brand and the last four digits leave
 * the form; the card number and security code are never stored or sent to the API.
 */
export function createDemoPaymentToken(
  cardNumber: string,
  now: number = Date.now(),
): CheckoutPaymentToken {
  const digits = cardNumber.replace(/\s/g, '');
  return {
    tokenId: `tok_${now}`,
    brand: digits.startsWith('4') ? 'Visa' : 'Card',
    last4: digits.slice(-4),
  };
}
