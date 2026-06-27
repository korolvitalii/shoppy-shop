import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorNotificationService } from '../../../core/errors/error-notification.service';
import { ErrorBanner } from './error-banner';

describe('ErrorBanner', () => {
  it('announces a friendly message and lets the user dismiss it', async () => {
    await TestBed.configureTestingModule({ imports: [ErrorBanner] }).compileComponents();
    const fixture = TestBed.createComponent(ErrorBanner);
    const notifications = TestBed.inject(ErrorNotificationService);
    notifications.show(new HttpErrorResponse({ status: 0 }));
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('Check your internet connection');
    expect(alert.textContent).toContain('NETWORK_ERROR');

    (alert.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });
});
