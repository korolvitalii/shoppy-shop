import { computed, Injectable, signal } from '@angular/core';
export interface AuthenticatedSessionUser {
  id: string;
  email: string;
}
const KEY = 'shoppyshop.session.v1';
@Injectable({ providedIn: 'root' })
export class AuthenticationSessionService {
  private readonly state = signal<AuthenticatedSessionUser | null>(this.restore());
  readonly user = this.state.asReadonly();
  readonly isAuthenticated = computed(() => this.state() !== null);
  start(user: AuthenticatedSessionUser): void {
    this.state.set(user);
    sessionStorage.setItem(KEY, JSON.stringify(user));
  }
  end(): void {
    this.state.set(null);
    sessionStorage.removeItem(KEY);
  }
  private restore(): AuthenticatedSessionUser | null {
    try {
      const value = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as unknown;
      return typeof value === 'object' && value !== null && 'id' in value && 'email' in value
        ? (value as AuthenticatedSessionUser)
        : null;
    } catch {
      return null;
    }
  }
}
