import { useState } from 'react';
import useUiStore from '../store/uiStore.js';
import Modal from './Modal.jsx';
import Button from './Button.jsx';

export function ConfirmDialog() {
  const confirmDialog = useUiStore((s) => s.confirmDialog);
  const closeConfirm = useUiStore((s) => s.closeConfirm);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (busy || !confirmDialog) return; // double-click / re-entry guard
    const dialogId = confirmDialog.id;
    setBusy(true);
    try {
      await confirmDialog.onConfirm?.();
    } finally {
      setBusy(false);
      // Resolve the askConfirm promise with `true` (explicit false for cancel paths).
      // Only when this dialog is still the active one — if a newer askConfirm
      // replaced it while we were in flight, the store already resolved ours as
      // cancelled and the new dialog's resolver must not be confirmed by us.
      if (useUiStore.getState().confirmDialog?.id === dialogId) closeConfirm(true);
    }
  };

  return (
    <Modal
      open={Boolean(confirmDialog)}
      onClose={() => closeConfirm(false)}
      title={confirmDialog?.title || 'Are you sure?'}
    >
      {confirmDialog?.message && <p className="text-sm text-slate-600 dark:text-slate-300">{confirmDialog.message}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" disabled={busy} onClick={() => closeConfirm(false)}>
          {confirmDialog?.cancelLabel || 'Cancel'}
        </Button>
        <Button variant={confirmDialog?.danger ? 'danger' : 'primary'} loading={busy} onClick={handleConfirm}>
          {confirmDialog?.confirmLabel || 'Confirm'}
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
