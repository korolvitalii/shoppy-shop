import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { UiTab } from './ui-tab';
import { UiTabs } from './ui-tabs';

@Component({
  imports: [UiTabs, UiTab],
  template: `<app-tabs label="Product information"
    ><app-tab id="description" label="Description">Details</app-tab
    ><app-tab id="disabled" label="Disabled" [disabled]="true">Hidden</app-tab
    ><app-tab id="delivery" label="Delivery">Returns</app-tab></app-tabs
  >`,
})
class Host {}

describe('UiTabs', () => {
  it('exposes tabs and one selected panel', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(3);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(fixture.nativeElement.querySelector('[role="tabpanel"]').textContent).toContain(
      'Details',
    );
  });

  it('supports arrow and End keyboard navigation while skipping disabled tabs', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    fixture.detectChanges();
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });
});
