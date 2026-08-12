import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { type Product } from '../../../shared/domain/product';
import { AssistantChatService } from './assistant-chat.service';
import {
  type AssistantChatRequest,
  type AssistantChatResponse,
} from './models/assistant-chat.models';

const product: Product = {
  id: 'jacket-1',
  groupId: 'outerwear',
  name: 'Rainguard Jacket',
  brand: 'Trailhead',
  description: 'A waterproof jacket.',
  imageUrl: '/jacket.jpg',
  price: 45,
  salePrice: null,
  inStock: true,
};

describe('AssistantChatService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('pushes an optimistic user message and appends the assistant reply on success', () => {
    const service = TestBed.inject(AssistantChatService);
    const http = TestBed.inject(HttpTestingController);

    service.send('show me waterproof jackets under $50');

    expect(service.messages()).toEqual([
      expect.objectContaining({ role: 'user', content: 'show me waterproof jackets under $50' }),
    ]);
    expect(service.isSending()).toBe(true);

    const request = http.expectOne('/api/assistant/chat');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      message: 'show me waterproof jackets under $50',
      history: [],
    });
    const response: AssistantChatResponse = { reply: 'Here you go!', products: [product] };
    request.flush(response);

    expect(service.isSending()).toBe(false);
    expect(service.messages()).toEqual([
      expect.objectContaining({ role: 'user', content: 'show me waterproof jackets under $50' }),
      expect.objectContaining({ role: 'assistant', content: 'Here you go!', products: [product] }),
    ]);
  });

  it('removes the optimistic user message when the request fails', () => {
    const service = TestBed.inject(AssistantChatService);
    const http = TestBed.inject(HttpTestingController);

    service.send('hello');
    http
      .expectOne('/api/assistant/chat')
      .flush(null, { status: 429, statusText: 'Too Many Requests' });

    expect(service.isSending()).toBe(false);
    expect(service.messages()).toEqual([]);
  });

  it('sends only the last ten prior messages as history', () => {
    const service = TestBed.inject(AssistantChatService);
    const http = TestBed.inject(HttpTestingController);

    for (let i = 0; i < 6; i++) {
      service.send(`message ${i}`);
      http.expectOne('/api/assistant/chat').flush({ reply: `reply ${i}`, products: [] });
    }
    // 6 user + 6 assistant = 12 prior messages before the next send.
    service.send('latest');
    const request = http.expectOne('/api/assistant/chat');
    const body = request.request.body as AssistantChatRequest;

    expect(body.history).toHaveLength(10);
    expect(body.message).toBe('latest');
    request.flush({ reply: 'ok', products: [] });
  });

  it('does not send an empty or whitespace-only message', () => {
    const service = TestBed.inject(AssistantChatService);
    const http = TestBed.inject(HttpTestingController);

    service.send('');
    service.send('   ');

    http.expectNone('/api/assistant/chat');
    expect(service.messages()).toEqual([]);
  });

  it('ignores another message while a request is in flight', () => {
    const service = TestBed.inject(AssistantChatService);
    const http = TestBed.inject(HttpTestingController);

    service.send('first');
    service.send('second');

    const request = http.expectOne('/api/assistant/chat');
    expect(request.request.body).toEqual({ message: 'first', history: [] });
    expect(service.messages()).toEqual([expect.objectContaining({ content: 'first' })]);
    request.flush({ reply: 'done', products: [] });
  });

  it('clears the conversation', () => {
    const service = TestBed.inject(AssistantChatService);
    const http = TestBed.inject(HttpTestingController);
    service.send('hello');
    http.expectOne('/api/assistant/chat').flush({ reply: 'hi', products: [] });

    service.clear();

    expect(service.messages()).toEqual([]);
  });

  it('opens, closes, and toggles the widget visibility', () => {
    const service = TestBed.inject(AssistantChatService);

    expect(service.isOpen()).toBe(false);
    service.open();
    expect(service.isOpen()).toBe(true);
    service.close();
    expect(service.isOpen()).toBe(false);
    service.toggle();
    expect(service.isOpen()).toBe(true);
  });
});
