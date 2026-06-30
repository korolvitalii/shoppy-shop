import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  effect,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

import { UiTab } from './ui-tab';
@Component({
  selector: 'app-tabs',
  imports: [NgTemplateOutlet],
  templateUrl: './ui-tabs.html',
  styleUrl: './ui-tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTabs {
  readonly label = input.required<string>();
  readonly tabs = contentChildren(UiTab);
  readonly selectedId = signal('');
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  constructor() {
    effect(() => {
      const tabs = this.tabs();
      if (!tabs.some((t) => t.id() === this.selectedId()))
        this.selectedId.set(tabs.find((t) => !t.disabled())?.id() ?? '');
    });
  }

  select(tab: UiTab): void {
    if (!tab.disabled()) this.selectedId.set(tab.id());
  }

  keydown(event: KeyboardEvent, current: UiTab): void {
    const enabled = this.tabs().filter((t) => !t.disabled());
    let index = enabled.indexOf(current);
    if (event.key === 'ArrowRight') index = (index + 1) % enabled.length;
    else if (event.key === 'ArrowLeft') index = (index - 1 + enabled.length) % enabled.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = enabled.length - 1;
    else return;
    event.preventDefault();
    this.select(enabled[index]);
    queueMicrotask(() =>
      this.host.nativeElement.querySelector<HTMLElement>(`#tab-${enabled[index].id()}`)?.focus(),
    );
  }
}
