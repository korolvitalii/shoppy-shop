import {
  ChangeDetectionStrategy,
  Component,
  input,
  type TemplateRef,
  viewChild,
} from '@angular/core';
@Component({
  selector: 'app-tab',
  template: `<ng-template #content><ng-content /></ng-template>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTab {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly disabled = input(false);
  readonly content = viewChild.required<TemplateRef<unknown>>('content');
}
