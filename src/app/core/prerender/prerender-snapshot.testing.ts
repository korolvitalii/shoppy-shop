import { APP_ID, PLATFORM_ID, type Provider, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';

/**
 * Runs `render` the way the server does while prerendering, and returns the transfer state that
 * would ship inside the page. The testing module is reset afterwards, ready for the browser side.
 */
export function prerender(providers: Provider[], render: () => void): string {
  TestBed.configureTestingModule({
    providers: [...providers, { provide: PLATFORM_ID, useValue: 'server' }],
  });
  render();
  const state = TestBed.inject(TransferState).toJson();
  TestBed.resetTestingModule();
  return state;
}

/**
 * Puts prerendered transfer state where the browser reads it on hydration. Call it after
 * configuring the browser-side TestBed and before anything injects TransferState; the returned
 * function removes it again.
 */
export function shipWithPage(state: string): () => void {
  const script = document.createElement('script');
  script.id = `${TestBed.inject(APP_ID)}-state`;
  script.type = 'application/json';
  script.textContent = state;
  document.body.append(script);
  return () => script.remove();
}
