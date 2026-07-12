import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { LocaleService, type SupportedLocale } from '../../../core/locale/locale.service';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.html',
  styleUrl: './language-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelector {
  readonly wide = input(false);
  protected readonly locale = inject(LocaleService);

  protected changeLocale(event: Event): void {
    this.locale.switchTo((event.target as HTMLSelectElement).value as SupportedLocale);
  }
}
