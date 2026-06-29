import { TestBed } from '@angular/core/testing';
import { LoadingService } from '../../../core/loading/loading.service';
import { LoadingIndicator } from './loading-indicator';

describe('LoadingIndicator', () => {
  it('announces global activity accessibly', async () => {
    await TestBed.configureTestingModule({ imports: [LoadingIndicator] }).compileComponents();
    const fixture = TestBed.createComponent(LoadingIndicator);
    const loading = TestBed.inject(LoadingService);
    vi.useFakeTimers();

    loading.start();
    vi.advanceTimersByTime(200);
    fixture.detectChanges();

    const indicator = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    expect(indicator).toBeTruthy();
    expect(indicator.getAttribute('aria-label')).toBe('Loading application content');

    loading.stop();
    vi.useRealTimers();
  });
});
