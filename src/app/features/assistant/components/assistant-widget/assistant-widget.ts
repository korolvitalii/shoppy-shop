import {
  ChangeDetectionStrategy,
  Component,
  effect,
  type ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageCircle, X } from 'lucide';

import { type Product } from '../../../../shared/domain/product';
import { LucideIcon } from '../../../../shared/ui/lucide-icon/lucide-icon';
import { AuthenticationSessionService } from '../../../auth/public-api';
import { BasketService } from '../../../basket/public-api';
import { FavoritesService } from '../../../favorites/public-api';
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
  protected readonly favorites = inject(FavoritesService);
  private readonly basket = inject(BasketService);
  private readonly router = inject(Router);
  private readonly session = inject(AuthenticationSessionService);
  protected readonly messageControl = new FormControl('', { nonNullable: true });
  protected readonly icons = { message: MessageCircle, close: X };
  private readonly messageInput = viewChild<ElementRef<HTMLInputElement>>('messageInput');

  /**
   * Recommendations added to the basket, keyed by message and product so each result confirms on
   * its own, as it did when every result tracked its own confirmation.
   */
  private readonly addedResults = signal<ReadonlySet<string>>(new Set());

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

  protected isAdded(messageId: string, product: Product): boolean {
    return this.addedResults().has(resultKey(messageId, product));
  }

  protected addToBasket(messageId: string, product: Product): void {
    if (!this.session.isAuthenticated()) {
      this.redirectToLogin();
      return;
    }
    this.basket.add(product);
    this.addedResults.update((keys) => new Set(keys).add(resultKey(messageId, product)));
  }

  protected toggleFavorite(product: Product): void {
    if (!this.session.isAuthenticated()) {
      this.redirectToLogin();
      return;
    }
    this.favorites.toggle(product);
  }

  // The widget is not rendered on the login page, and the panel reopens with the conversation when
  // the customer returns, so it stays open across the redirect.
  private redirectToLogin(): void {
    void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }
}

function resultKey(messageId: string, product: Product): string {
  return `${messageId}:${product.id}`;
}
