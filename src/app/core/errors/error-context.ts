import { HttpContextToken } from '@angular/common/http';

export const SKIP_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);

/** Statuses handled by the caller instead of the global error banner. */
export const SKIP_ERROR_NOTIFICATION_STATUSES = new HttpContextToken<readonly number[]>(() => []);
