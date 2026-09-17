import Modal from './Modal';

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="m-0">{message}</p>
      <div className="modal-foot">
        <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" type="button" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
