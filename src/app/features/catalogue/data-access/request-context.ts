import { HttpContext } from '@angular/common/http';

import { SKIP_ERROR_NOTIFICATION } from '../../../core/errors/error-context';
import { SKIP_GLOBAL_LOADING } from '../../../core/loading/loading-context';

/** A silent request stays out of the global error banner and loading bar. */
export function requestContext(silent: boolean | undefined): HttpContext {
  const context = new HttpContext();
  return silent
    ? context.set(SKIP_ERROR_NOTIFICATION, true).set(SKIP_GLOBAL_LOADING, true)
    : context;
}
