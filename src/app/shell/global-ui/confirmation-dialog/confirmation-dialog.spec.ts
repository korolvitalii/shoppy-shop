import { TestBed } from '@angular/core/testing';

import { ConfirmationService } from '../../../core/confirmation/confirmation.service';
import { ConfirmationDialog } from './confirmation-dialog';

describe('ConfirmationDialog', () => {
  it('announces the decision and supports cancellation', async () => {
    await TestBed.configureTestingModule({ imports: [ConfirmationDialog] }).compileComponents();
    const fixture = TestBed.createComponent(ConfirmationDialog);
    const service = TestBed.inject(ConfirmationService);
    const result = service.confirm({
      title: 'Log out?',
      message: 'You will need to sign in again.',
      confirmLabel: 'Log out',
      tone: 'danger',
    });
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="alertdialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('Log out?');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    (dialog.querySelector('.cancel') as HTMLButtonElement).click();

    await expect(result).resolves.toBe(false);
  });
});
