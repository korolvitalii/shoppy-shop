import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { AuthenticationSessionService } from '../data-access/authentication-session.service';
export const authenticationGuard: CanActivateFn = (_route, state) => {
  const session = inject(AuthenticationSessionService);
  return session.isAuthenticated()
    ? true
    : inject(Router).parseUrl(`/login?returnUrl=${encodeURIComponent(state.url)}`);
};

export const anonymousGuard: CanActivateFn = () => {
  const session = inject(AuthenticationSessionService);
  return session.isAuthenticated() ? inject(Router).parseUrl('/products') : true;
};
