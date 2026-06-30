import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { loadingInterceptor } from './loading.interceptor';
import { LoadingService } from './loading.service';
import { SKIP_GLOBAL_LOADING } from './loading-context';

describe('loadingInterceptor', () => {
  const loading = { start: vi.fn(), stop: vi.fn() };

  beforeEach(() => {
    loading.start.mockReset();
    loading.stop.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
        { provide: LoadingService, useValue: loading },
      ],
    });
  });

  it('tracks an HTTP request through completion', () => {
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);

    http.get('/api/products').subscribe();
    expect(loading.start).toHaveBeenCalledOnce();
    controller.expectOne('/api/products').flush([]);
    expect(loading.stop).toHaveBeenCalledOnce();
  });

  it('allows background requests to opt out', () => {
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);

    http
      .get('/api/background', {
        context: new HttpContext().set(SKIP_GLOBAL_LOADING, true),
      })
      .subscribe();
    controller.expectOne('/api/background').flush({});

    expect(loading.start).not.toHaveBeenCalled();
    expect(loading.stop).not.toHaveBeenCalled();
  });
});
