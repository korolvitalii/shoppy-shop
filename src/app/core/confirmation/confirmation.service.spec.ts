import { TestBed } from '@angular/core/testing';

import { ConfirmationService } from './confirmation.service';

describe('ConfirmationService', () => {
  it('resolves destructive decisions explicitly', async () => {
    const service = TestBed.inject(ConfirmationService);
    const accepted = service.confirm({
      title: 'Remove item?',
      message: 'This item will leave your basket.',
      confirmLabel: 'Remove item',
      tone: 'danger',
    });

    expect(service.current()?.title).toBe('Remove item?');
    service.accept();

    await expect(accepted).resolves.toBe(true);
    expect(service.current()).toBeNull();
  });
});
