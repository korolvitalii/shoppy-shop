import { meetsPasswordPolicy, passwordPolicyChecks } from './password-policy';

describe('passwordPolicyChecks', () => {
  it('reports each rule the password still misses', () => {
    expect(passwordPolicyChecks('')).toEqual({
      length: false,
      lowercase: false,
      uppercase: false,
      digit: false,
      symbol: false,
    });
    expect(passwordPolicyChecks('lowercase')).toEqual({
      length: false,
      lowercase: true,
      uppercase: false,
      digit: false,
      symbol: false,
    });
  });

  it('needs at least ten characters', () => {
    expect(passwordPolicyChecks('Short1!xy').length).toBe(false);
    expect(passwordPolicyChecks('Short1!xyz').length).toBe(true);
  });

  it('accepts a password that meets every rule', () => {
    const checks = passwordPolicyChecks('Shoppy-Shop-2026');

    expect(meetsPasswordPolicy(checks)).toBe(true);
    expect(meetsPasswordPolicy(passwordPolicyChecks('ShoppyShop2026'))).toBe(false);
  });
});
