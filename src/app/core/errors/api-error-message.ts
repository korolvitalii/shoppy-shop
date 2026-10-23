interface ApiIssue {
  field?: string;
  code?: string;
  parameters?: Record<string, unknown>;
}

export function apiErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const problem = body as { code?: string; validationIssues?: ApiIssue[] };
  const issues = Array.isArray(problem.validationIssues) ? problem.validationIssues : [];
  const messages = issues
    .filter((issue) => issue && typeof issue === 'object')
    .map((issue) => message(issue.code, issue.parameters, issue.field))
    .filter((value): value is string => !!value);
  return messages.length ? [...new Set(messages)].join(' ') : message(problem.code);
}

function message(
  code?: string,
  parameters?: Record<string, unknown>,
  field?: string,
): string | null {
  // A rule's limit comes from the API's configuration. Without it the message is skipped, so the
  // status fallback applies rather than a number copied here that may be out of date.
  const maximum = numberParameter(parameters, 'maximum');
  const minimum = numberParameter(parameters, 'minimum');
  switch (code) {
    case 'auth.invalid_credentials':
      return $localize`:@@apiInvalidCredentials:Invalid email or password.`;
    case 'auth.session_invalid':
      return $localize`:@@unauthorizedError:Your session has expired. Please sign in again.`;
    case 'catalogue.cursor_invalid':
      return $localize`:@@apiInvalidCursor:The product list has changed. Refresh the page and try again.`;
    case 'catalogue.search_invalid':
      return maximum === null
        ? null
        : $localize`:@@apiSearchLength:Search must be ${maximum}:maximum: characters or fewer.`;
    case 'catalogue.limit_invalid':
      return maximum === null
        ? null
        : $localize`:@@apiPageSize:Page size must be between 1 and ${maximum}:maximum:.`;
    case 'locale.invalid':
      return $localize`:@@apiUnsupportedLocale:The selected language is not supported.`;
    case 'order.products_missing':
      return $localize`:@@apiProductsMissing:One or more products are no longer available. Check your basket.`;
    case 'order.out_of_stock':
      return $localize`:@@apiProductsOutOfStock:One or more products are out of stock. Check your basket.`;
    case 'order.idempotency_conflict':
      return $localize`:@@apiOrderConflict:This checkout has already been used for a different order. Start checkout again.`;
    case 'assistant.unavailable':
      return $localize`:@@apiAssistantUnavailable:The shopping assistant is currently unavailable.`;
    case 'resource.not_found':
      return $localize`:@@notFoundError:The requested information could not be found.`;
    case 'request.conflict':
      return $localize`:@@conflictError:This request conflicts with a recent change. Refresh and try again.`;
    case 'identity.PasswordTooShort':
      return minimum === null
        ? null
        : $localize`:@@apiPasswordLength:Passwords must contain at least ${minimum}:minimum: characters.`;
    case 'identity.PasswordRequiresDigit':
      return $localize`:@@apiPasswordDigit:Include a number in your password.`;
    case 'identity.PasswordRequiresLower':
      return $localize`:@@apiPasswordLower:Include a lowercase letter in your password.`;
    case 'identity.PasswordRequiresUpper':
      return $localize`:@@apiPasswordUpper:Include an uppercase letter in your password.`;
    case 'identity.PasswordRequiresNonAlphanumeric':
      return $localize`:@@apiPasswordSymbol:Include a symbol in your password.`;
    case 'identity.PasswordRequiresUniqueChars':
      return $localize`:@@apiPasswordUnique:Use more distinct characters in your password.`;
    case 'identity.DuplicateEmail':
    case 'identity.DuplicateUserName':
      return $localize`:@@apiDuplicateEmail:An account with this email already exists.`;
    case 'identity.InvalidEmail':
      return $localize`:@@emailInvalid:Enter a valid email address.`;
    case 'identity.PasswordMismatch':
      return $localize`:@@apiPasswordMismatch:The current password is incorrect.`;
    case 'validation.field_invalid': {
      const label = fieldLabel(field);
      return label ? $localize`:@@apiInvalidField:Check ${label}:fieldName:.` : null;
    }
    default:
      return null;
  }
}

function numberParameter(parameters: Record<string, unknown> | undefined, name: string) {
  const value = parameters?.[name];
  return typeof value === 'number' ? value : null;
}

function fieldLabel(field?: string): string | null {
  if (typeof field !== 'string') return null;
  switch (field.split('.').at(-1)?.toLowerCase()) {
    case 'email':
      return $localize`:@@emailAddress:Email address`;
    case 'password':
    case 'newpassword':
      return $localize`:@@password:Password`;
    case 'displayname':
      return $localize`:@@fullName:Full name`;
    default:
      return null;
  }
}
