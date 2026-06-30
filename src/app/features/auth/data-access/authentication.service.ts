import { Injectable } from '@angular/core';
import { delay, type Observable, of } from 'rxjs';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export type LoginResult =
  { success: true; user: AuthenticatedUser } | { success: false; error: string };

const DEMO_CREDENTIALS: LoginCredentials = {
  email: 'demo@shoppyshop.test',
  password: 'ShoppyShop123!',
};

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  login(credentials: LoginCredentials): Observable<LoginResult> {
    const isDemoCustomer =
      credentials.email === DEMO_CREDENTIALS.email &&
      credentials.password === DEMO_CREDENTIALS.password;

    const result: LoginResult = isDemoCustomer
      ? {
          success: true,
          user: { id: 'customer-1', email: DEMO_CREDENTIALS.email },
        }
      : { success: false, error: 'The email or password is incorrect.' };

    return of(result).pipe(delay(500));
  }
}
