import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { type Product } from '../../../catalogue/models/product';
import { AssistantChatService } from '../../data-access/assistant-chat.service';
import { AssistantWidget } from './assistant-widget';

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

describe('AssistantWidget', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantWidget],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('renders the launcher when closed and shows no panel', () => {
    const fixture = TestBed.createComponent(AssistantWidget);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.assistant-launcher')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('opens the panel when the launcher is clicked', () => {
    const fixture = TestBed.createComponent(AssistantWidget);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.assistant-launcher') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('closes the panel on Escape', () => {
    const fixture = TestBed.createComponent(AssistantWidget);
    const assistant = TestBed.inject(AssistantChatService);
    assistant.open();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(assistant.isOpen()).toBe(false);
  });

  it('sends the trimmed message and clears the input on submit', () => {
    const fixture = TestBed.createComponent(AssistantWidget);
    const http = TestBed.inject(HttpTestingController);
    const assistant = TestBed.inject(AssistantChatService);
    assistant.open();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '  show me jackets  ';
    input.dispatchEvent(new Event('input'));
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { cancelable: true }),
    );
    fixture.detectChanges();

    expect(assistant.messages()).toEqual([
      expect.objectContaining({ role: 'user', content: 'show me jackets' }),
    ]);
    expect(input.value).toBe('');
    http.expectOne('/api/assistant/chat').flush({ reply: 'ok', products: [] });
  });

  it('renders one product result per recommended product', () => {
    const fixture = TestBed.createComponent(AssistantWidget);
    const http = TestBed.inject(HttpTestingController);
    const assistant = TestBed.inject(AssistantChatService);
    assistant.open();
    assistant.send('show me jackets');
    http.expectOne('/api/assistant/chat').flush({ reply: 'Here!', products: [product] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-assistant-product-result')).toHaveLength(1);
  });
});
