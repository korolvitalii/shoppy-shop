import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { createElement, type IconNode } from 'lucide';

@Component({
  selector: 'app-lucide-icon',
  template: '',
  styles: `
    :host {
      display: inline-flex;
      width: 1.5rem;
      height: 1.5rem;
      flex: none;
    }
  `,
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LucideIcon {
  readonly icon = input.required<IconNode>();
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => {
      const svg = createElement(this.icon(), {
        width: '100%',
        height: '100%',
        'stroke-width': 2,
        'aria-hidden': 'true',
        focusable: 'false',
      });
      this.element.nativeElement.replaceChildren(svg);
    });
  }
}
