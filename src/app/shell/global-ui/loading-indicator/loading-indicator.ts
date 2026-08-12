import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { LoadingService } from '../../../core/loading/loading.service';

@Component({
  selector: 'app-loading-indicator',
  templateUrl: './loading-indicator.html',
  styleUrl: './loading-indicator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingIndicator {
  protected readonly loading = inject(LoadingService);
}
