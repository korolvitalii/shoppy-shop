import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, of } from 'rxjs';

import {
  type AssistantChatMessage,
  type AssistantChatRequest,
  type AssistantChatResponse,
} from './models/assistant-chat.models';

const MAX_HISTORY_TURNS = 10;

@Injectable({ providedIn: 'root' })
export class AssistantChatService {
  private readonly http = inject(HttpClient);
  private readonly messagesState = signal<readonly AssistantChatMessage[]>([]);
  private readonly openState = signal(false);
  private readonly sendingState = signal(false);

  readonly messages = this.messagesState.asReadonly();
  readonly isOpen = this.openState.asReadonly();
  readonly isSending = this.sendingState.asReadonly();

  open(): void {
    this.openState.set(true);
  }

  close(): void {
    this.openState.set(false);
  }

  toggle(): void {
    this.openState.update((open) => !open);
  }

  send(text: string): void {
    const trimmed = text.trim();
    if (!trimmed || this.sendingState()) return;

    const history = this.messagesState()
      .slice(-MAX_HISTORY_TURNS)
      .map(({ role, content }) => ({ role, content }));
    const userMessage: AssistantChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      products: [],
    };
    this.messagesState.update((messages) => [...messages, userMessage]);
    this.sendingState.set(true);

    const request: AssistantChatRequest = { message: trimmed, history };
    this.http
      .post<AssistantChatResponse>('/api/assistant/chat', request)
      .pipe(
        catchError(() => {
          // The global api-error interceptor already surfaces a toast for the failure — just
          // drop the optimistic user message so the thread doesn't show an unanswered question.
          this.messagesState.update((messages) => messages.filter((m) => m.id !== userMessage.id));
          return of(null);
        }),
      )
      .subscribe((response) => {
        this.sendingState.set(false);
        if (!response) return;

        this.messagesState.update((messages) => [
          ...messages,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.reply,
            products: response.products,
          },
        ]);
      });
  }

  clear(): void {
    this.messagesState.set([]);
  }
}
