import { computed, Injectable, signal } from '@angular/core';

import { type AuthResult, type UserDto } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthenticationSessionService {
  private readonly userState = signal<UserDto | null>(null);
  private readonly accessTokenState = signal<string | null>(null);
  private readonly accessTokenExpiresAtState = signal<string | null>(null);

  readonly user = this.userState.asReadonly();
  readonly accessToken = this.accessTokenState.asReadonly();
  readonly accessTokenExpiresAt = this.accessTokenExpiresAtState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);

  start(result: AuthResult): void {
    this.userState.set(result.user);
    this.accessTokenState.set(result.accessToken);
    this.accessTokenExpiresAtState.set(result.accessTokenExpiresAt);
  }

  end(): void {
    this.userState.set(null);
    this.accessTokenState.set(null);
    this.accessTokenExpiresAtState.set(null);
  }
}
