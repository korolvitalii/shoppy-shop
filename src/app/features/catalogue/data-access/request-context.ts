import { HttpContext } from '@angular/common/http';

import { SKIP_ERROR_NOTIFICATION } from '../../../core/errors/error-context';
import { SKIP_GLOBAL_LOADING } from '../../../core/loading/loading-context';
import { LOCALIZED_CONTENT } from '../../../core/locale/locale-context';

export interface CatalogueRequestOptions {
  /** Supporting content can fail or stay pending without the global banner and loading bar. */
  readonly silent?: boolean;
}

/**
 * Every catalogue request asks for the storefront's language. A silent one also stays out of the
 * global error banner and loading bar.
 */
export function requestContext(silent: boolean | undefined): HttpContext {
  const context = new HttpContext().set(LOCALIZED_CONTENT, true);
  return silent
    ? context.set(SKIP_ERROR_NOTIFICATION, true).set(SKIP_GLOBAL_LOADING, true)
    : context;
}
