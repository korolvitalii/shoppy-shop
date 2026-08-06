import { HttpClient, HttpContext } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, type Observable, of, tap } from 'rxjs';

import { SKIP_ERROR_NOTIFICATION } from '../errors/error-context';

export interface FeatureConfig {
  assistantEnabled: boolean;
}

const DEFAULT_CONFIG: FeatureConfig = { assistantEnabled: true };

const silentContext = () => new HttpContext().set(SKIP_ERROR_NOTIFICATION, true);

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly configState = signal<FeatureConfig>(DEFAULT_CONFIG);

  readonly assistantEnabled = computed(() => this.configState().assistantEnabled);

  load(): Observable<FeatureConfig> {
    return this.http.get<FeatureConfig>('/api/feature-config', { context: silentContext() }).pipe(
      tap((config) => this.configState.set(config)),
      // Fail open: an unreachable config endpoint shouldn't hide a working feature.
      catchError(() => of(DEFAULT_CONFIG)),
    );
  }
}
