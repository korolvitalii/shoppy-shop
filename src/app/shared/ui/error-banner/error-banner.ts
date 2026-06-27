import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ErrorNotificationService } from '../../../core/errors/error-notification.service';

@Component({
  selector: 'app-error-banner',
  templateUrl: './error-banner.html',
  styleUrl: './error-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorBanner {
  protected readonly errors = inject(ErrorNotificationService);
}
