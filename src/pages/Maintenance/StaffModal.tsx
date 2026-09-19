import { useState } from 'react';
import type { MaintenanceStaffStatus } from '../../data/mock';
import { getStaffBlockers } from '../../lib/staff';
import { useStore } from '../../state/useStore';
import { Badge } from '../../components/ui';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import StaffFormModal from './StaffFormModal';

function statusTone(s: MaintenanceStaffStatus): 'success' | 'neutral' {
  return s === 'Active' ? 'success' : 'neutral';
}

export default function StaffModal({ onClose }: { onClose: () => void }) {
  const staff = useStore((s) => s.staff);
  const maintenance = useStore((s) => s.maintenance);
  const updateStaff = useStore((s) => s.updateStaff);
  const deleteStaff = useStore((s) => s.deleteStaff);
  const pushToast = useStore((s) => s.pushToast);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const editing = editId ? staff.find((s) => s.id === editId) ?? null : null;
  const deleting = deleteId ? staff.find((s) => s.id === deleteId) ?? null : null;
  const blockers = deleting ? getStaffBlockers(deleting.id, maintenance) : [];

  const toggleStatus = async (id: string, status: MaintenanceStaffStatus) => {
    const next: MaintenanceStaffStatus = status === 'Active' ? 'Inactive' : 'Active';
    try {
      const rejected = await updateStaff(id, { status: next });
      if (rejected) {
        pushToast(rejected);
        return;
      }
      pushToast(`Marked ${next}`);
    } catch (error) {
      console.error(error);
      pushToast(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteStaff(deleting.id);
      setDeleteId(null);
      pushToast(`Removed ${deleting.name} from maintenance staff`);
    } catch (error) {
      console.error(error);
      pushToast(error instanceof Error ? error.message : 'Failed to delete staff member');
    }
  };

  return (
    <Modal title="Maintenance Staff" onClose={onClose} wide>
      <div className="row">
        <span className="small muted">{staff.length} staff member{staff.length === 1 ? '' : 's'}</span>
        <button className="btn btn-teal btn-sm" type="button" onClick={() => setFormOpen(true)}>+ Add Staff</button>
      </div>

      {staff.length === 0 ? (
        <p className="muted">No maintenance staff yet.</p>
      ) : (
        <div className="table-wrap table-flush">
          <table className="tenant-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Specialty</th>
                <th>Status</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td className="small">
                    <div>{s.email}</div>
                    <div className="muted">{s.phone === '' ? '—' : s.phone}</div>
                  </td>
                  <td>{s.specialty}</td>
                  <td><Badge tone={statusTone(s.status)}>{s.status}</Badge></td>
                  <td>
                    <span className="flex gap-1.5 justify-end flex-wrap">
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => toggleStatus(s.id, s.status)}>
                        {s.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditId(s.id)}>Edit</button>
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => setDeleteId(s.id)}>Delete</button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="modal-foot">
        <button className="btn btn-ghost" type="button" onClick={onClose}>Close</button>
      </div>

      {formOpen && <StaffFormModal onClose={() => setFormOpen(false)} />}
      {editing && <StaffFormModal staffMember={editing} onClose={() => setEditId(null)} />}

      {deleting && blockers.length > 0 && (
        <Modal title={`Cannot delete ${deleting.name}`} onClose={() => setDeleteId(null)}>
          <p className="m-0">This staff member still has open requests assigned. Reassign or complete these first:</p>
          <div className="list mt-0">
            {blockers.map((b) => (
              <div key={b} className="list-row"><span>{b}</span></div>
            ))}
          </div>
          <div className="modal-foot">
            <button className="btn btn-teal" type="button" onClick={() => setDeleteId(null)}>Understood</button>
          </div>
        </Modal>
      )}

      {deleting && blockers.length === 0 && (
        <ConfirmDialog
          title="Delete Staff Member"
          message={`Remove ${deleting.name} from the maintenance staff directory? Completed requests keep their history.`}
          confirmLabel="Delete Staff Member"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </Modal>
  );
}
