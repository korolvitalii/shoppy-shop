import { type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer, finalize } from 'rxjs';

import { LoadingService } from './loading.service';
import { SKIP_GLOBAL_LOADING } from './loading-context';

export const loadingInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.context.get(SKIP_GLOBAL_LOADING)) return next(request);

  const loading = inject(LoadingService);
  return defer(() => {
    loading.start();
    return next(request).pipe(finalize(() => loading.stop()));
  });
};
