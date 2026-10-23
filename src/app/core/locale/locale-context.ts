import { HttpContextToken } from '@angular/common/http';

/**
 * Marks a request whose response holds catalogue text, so `apiLocaleInterceptor` asks the API for
 * the storefront's language. Set by the repository that owns the endpoint.
 */
export const LOCALIZED_CONTENT = new HttpContextToken<boolean>(() => false);
