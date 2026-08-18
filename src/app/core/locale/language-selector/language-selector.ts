import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { type AppLocale, supportedLocales } from '../locale.config';
import { LocaleService, type SupportedLocale } from '../locale.service';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.html',
  styleUrl: './language-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelector {
  readonly wide = input(false);
  protected readonly locale = inject(LocaleService);
  protected readonly locales = supportedLocales;

  protected select(option: AppLocale): void {
    this.locale.switchTo(option.locale as SupportedLocale);
  }

  protected keydown(event: KeyboardEvent, current: AppLocale): void {
    let index = this.locales.indexOf(current);
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
      index = (index + 1) % this.locales.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      index = (index - 1 + this.locales.length) % this.locales.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = this.locales.length - 1;
    else return;
    event.preventDefault();
    this.select(this.locales[index]);
  }
}
