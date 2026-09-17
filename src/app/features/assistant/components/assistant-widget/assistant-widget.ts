import {
  ChangeDetectionStrategy,
  Component,
  effect,
  type ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MessageCircle, X } from 'lucide';

import { LucideIcon } from '../../../../shared/ui/lucide-icon/lucide-icon';
import { AssistantChatService } from '../../data-access/assistant-chat.service';
import { AssistantProductResult } from '../assistant-product-result/assistant-product-result';

@Component({
  selector: 'app-assistant-widget',
  imports: [ReactiveFormsModule, AssistantProductResult, LucideIcon],
  templateUrl: './assistant-widget.html',
  styleUrl: './assistant-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantWidget {
  protected readonly assistant = inject(AssistantChatService);
  protected readonly messageControl = new FormControl('', { nonNullable: true });
  protected readonly icons = { message: MessageCircle, close: X };
  private readonly messageInput = viewChild<ElementRef<HTMLInputElement>>('messageInput');

  protected readonly examplePrompts = [
    $localize`:@@assistantExamplePromptOne:Waterproof jackets under £50`,
    $localize`:@@assistantExamplePromptTwo:Gifts for a coffee lover`,
    $localize`:@@assistantExamplePromptThree:Comfortable shoes for travel`,
  ];

  constructor() {
    effect(() => {
      if (this.assistant.isOpen()) this.messageInput()?.nativeElement.focus();
    });
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    const value = this.messageControl.value;
    if (!value.trim()) return;
    this.assistant.send(value);
    this.messageControl.reset('');
  }

  protected sendExample(prompt: string): void {
    this.assistant.send(prompt);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.assistant.close();
    }
  }
}
