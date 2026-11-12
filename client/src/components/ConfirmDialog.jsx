import useUiStore from '../store/uiStore.js';
import Modal from './Modal.jsx';
import Button from './Button.jsx';

export function ConfirmDialog() {
  const confirmDialog = useUiStore((s) => s.confirmDialog);
  const closeConfirm = useUiStore((s) => s.closeConfirm);

  const handleConfirm = () => {
    confirmDialog?.onConfirm?.();
    closeConfirm();
  };

  return (
    <Modal open={Boolean(confirmDialog)} onClose={closeConfirm} title={confirmDialog?.title || 'Are you sure?'}>
      {confirmDialog?.message && <p className="text-sm text-slate-600 dark:text-slate-300">{confirmDialog.message}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={closeConfirm}>
          {confirmDialog?.cancelLabel || 'Cancel'}
        </Button>
        <Button variant={confirmDialog?.danger ? 'danger' : 'primary'} onClick={handleConfirm}>
          {confirmDialog?.confirmLabel || 'Confirm'}
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
