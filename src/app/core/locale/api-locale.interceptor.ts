import { type HttpInterceptorFn } from '@angular/common/http';
import { inject, LOCALE_ID } from '@angular/core';

import { getLocaleDefinition } from './locale.config';
import { LOCALIZED_CONTENT } from './locale-context';

/**
 * API content follows the storefront selection rather than the browser language preference. The
 * locale is always explicit, including the default, so nothing depends on the two sides agreeing
 * on which language the API assumes when it is left out.
 */
export const apiLocaleInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.context.get(LOCALIZED_CONTENT)) return next(request);
  const locale = getLocaleDefinition(inject(LOCALE_ID)).path;
  return next(request.clone({ params: request.params.set('locale', locale) }));
};
