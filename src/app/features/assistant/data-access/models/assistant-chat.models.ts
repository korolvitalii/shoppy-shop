import { type Product } from '../../../../shared/domain/product';

export interface AssistantChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantChatRequest {
  message: string;
  history: readonly AssistantChatTurn[];
}

export interface AssistantChatResponse {
  reply: string;
  products: readonly Product[];
}

export interface AssistantChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products: readonly Product[];
}
