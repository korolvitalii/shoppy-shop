import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { type Product } from '../../../../shared/domain/product';
import { AuthenticationSessionService } from '../../../auth/public-api';
import { BasketService } from '../../../basket/public-api';
import { FavoritesService } from '../../../favorites/public-api';
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
  isNew: false,
  giftWrappable: false,
};

describe('AssistantWidget', () => {
  const authenticated = signal(true);
  const basket = { add: vi.fn() };
  const favorites = { has: vi.fn(() => false), toggle: vi.fn() };

  beforeEach(async () => {
    authenticated.set(true);
    basket.add.mockReset();
    favorites.toggle.mockReset();

    await TestBed.configureTestingModule({
      imports: [AssistantWidget],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthenticationSessionService, useValue: { isAuthenticated: authenticated } },
        { provide: BasketService, useValue: basket },
        { provide: FavoritesService, useValue: favorites },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.restoreAllMocks();
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

  function renderRecommendations(...replies: (readonly Product[])[]) {
    const fixture = TestBed.createComponent(AssistantWidget);
    const http = TestBed.inject(HttpTestingController);
    const assistant = TestBed.inject(AssistantChatService);
    assistant.open();
    for (const products of replies) {
      assistant.send('show me jackets');
      http.expectOne('/api/assistant/chat').flush({ reply: 'Here!', products });
    }
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      addButtons: () => [...element.querySelectorAll<HTMLButtonElement>('.add-to-basket')],
      favoriteButton: () => element.querySelector('.favorite-button') as HTMLButtonElement,
    };
  }

  it('sends signed-out customers to login instead of changing the basket or favourites', () => {
    authenticated.set(false);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const { fixture, addButtons, favoriteButton } = renderRecommendations([product]);

    addButtons()[0].click();
    favoriteButton().click();
    fixture.detectChanges();

    expect(basket.add).not.toHaveBeenCalled();
    expect(favorites.toggle).not.toHaveBeenCalled();
    expect(addButtons()[0].disabled).toBe(false);
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/' } });
  });

  it('adds a recommendation to the basket and confirms only that result', () => {
    const { fixture, addButtons } = renderRecommendations([product], [product]);

    addButtons()[0].click();
    fixture.detectChanges();

    expect(basket.add).toHaveBeenCalledWith(product);
    expect(addButtons()[0].disabled).toBe(true);
    expect(addButtons()[0].textContent).toContain('Added');
    expect(addButtons()[1].disabled).toBe(false);
  });

  it('toggles a favourite for signed-in customers', () => {
    const { fixture, favoriteButton } = renderRecommendations([product]);

    favoriteButton().click();
    fixture.detectChanges();

    expect(favorites.toggle).toHaveBeenCalledWith(product);
  });

  /** Lays the log out as a browser would: 300px high, with messages stacked `height` px apart. */
  function stackMessages(height: number): void {
    const messagesIn = (element: Element | null) => [
      ...(element?.querySelectorAll('.assistant-message') ?? []),
    ];
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(300);
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function (this: Element) {
      return messagesIn(this).length * height;
    });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      return { top: messagesIn(this.parentElement).indexOf(this) * height } as DOMRect;
    });
  }

  function sendAndReply(fixture: ComponentFixture<AssistantWidget>, reply: string): void {
    TestBed.inject(AssistantChatService).send('show me jackets');
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/assistant/chat')
      .flush({ reply, products: [] });
    fixture.detectChanges();
  }

  const messageLog = (fixture: ComponentFixture<AssistantWidget>) =>
    fixture.nativeElement.querySelector('[role="log"]') as HTMLElement;

  it('scrolls to the end of the conversation when a reply arrives', () => {
    stackMessages(100);
    const fixture = TestBed.createComponent(AssistantWidget);
    TestBed.inject(AssistantChatService).open();
    fixture.detectChanges();

    sendAndReply(fixture, 'First');
    sendAndReply(fixture, 'Second');

    expect(messageLog(fixture).scrollTop).toBe(100);
  });

  it('shows a reply taller than the log from its first line', () => {
    stackMessages(500);
    const fixture = TestBed.createComponent(AssistantWidget);
    TestBed.inject(AssistantChatService).open();
    fixture.detectChanges();

    sendAndReply(fixture, 'A long answer');

    expect(messageLog(fixture).scrollTop).toBe(500);
  });

  it('shows the latest message when the panel reopens', () => {
    stackMessages(100);
    const fixture = TestBed.createComponent(AssistantWidget);
    const assistant = TestBed.inject(AssistantChatService);
    assistant.open();
    fixture.detectChanges();
    sendAndReply(fixture, 'First');
    sendAndReply(fixture, 'Second');

    assistant.close();
    fixture.detectChanges();
    assistant.open();
    fixture.detectChanges();

    expect(messageLog(fixture).scrollTop).toBe(100);
  });
});
