/**
 * The API's ASP.NET Identity password policy (RequiredLength 10, plus a digit, a lowercase letter,
 * an uppercase letter and a non-alphanumeric character), checked before submission so the
 * customer sees which rules are still unmet. Keep both sides in step if the policy changes.
 */
export interface PasswordPolicyChecks {
  readonly length: boolean;
  readonly lowercase: boolean;
  readonly uppercase: boolean;
  readonly digit: boolean;
  readonly symbol: boolean;
}

const MIN_PASSWORD_LENGTH = 10;

export function passwordPolicyChecks(password: string): PasswordPolicyChecks {
  return {
    length: password.length >= MIN_PASSWORD_LENGTH,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    symbol: /[^a-zA-Z0-9]/.test(password),
  };
}

export function meetsPasswordPolicy(checks: PasswordPolicyChecks): boolean {
  return Object.values(checks).every(Boolean);
}
