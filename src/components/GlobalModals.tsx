import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/useStore';
import { useAsyncAction } from '../lib/useAsyncAction';
import { toIsoDay } from '../lib/format';
import AddPropertyModal from '../pages/Properties/AddPropertyModal';
import { EMPTY_PROPERTY_DRAFT } from '../pages/Properties/propertyForm';
import TenantFormModal from '../pages/Tenants/TenantFormModal';
import AddLeaseModal from '../pages/Leases/AddLeaseModal';
import RecordPaymentModal from '../pages/Payments/RecordPaymentModal';
import NewMaintenanceModal from '../pages/Maintenance/NewMaintenanceModal';
import UploadDocumentModal from '../pages/Documents/UploadDocumentModal';

export type GlobalModal = 'property' | 'tenant' | 'lease' | 'payment' | 'maintenance' | 'document';

interface GlobalModalsProps {
  open: GlobalModal | null;
  onClose: () => void;
}

export default function GlobalModals({ open, onClose }: GlobalModalsProps) {
  const addProperty = useStore((s) => s.addProperty);
  const addTenant = useStore((s) => s.addTenant);
  const addLease = useStore((s) => s.addLease);
  const addPayment = useStore((s) => s.addPayment);
  const addMaintenance = useStore((s) => s.addMaintenance);
  const addDocument = useStore((s) => s.addDocument);
  const pushToast = useStore((s) => s.pushToast);
  const properties = useStore((s) => s.properties);
  const units = useStore((s) => s.units);
  const staff = useStore((s) => s.staff);
  const tenants = useStore((s) => s.tenants);
  const leases = useStore((s) => s.leases);

  const run = useAsyncAction();
  const navigate = useNavigate();

  const submit = async (
    action: () => Promise<unknown>,
    success: string,
    failure: string,
    redirectTo?: string,
  ) => {
    if (!(await run(action, failure))) return;
    onClose();
    pushToast(success);
    if (redirectTo) navigate(redirectTo);
  };

  switch (open) {
    case 'property':
      return (
        <AddPropertyModal
          mode="add"
          title="Add Property"
          initial={EMPTY_PROPERTY_DRAFT}
          initialImageUrl=""
          onClose={onClose}
          onSubmit={(d, image) =>
            submit(() => addProperty(d, image), 'Property created successfully', 'Failed to create property', '/properties')
          }
        />
      );
    case 'tenant':
      return (
        <TenantFormModal
          title="Add Tenant"
          initial={{
            name: '', email: '', phone: '', propertyId: properties[0]?.id ?? '',
            unit: '', unitId: undefined, beds: '2 BR', rent: 0, leaseStart: '', leaseEnd: '', status: 'Active',
          }}
          properties={properties}
          units={units}
          tenants={tenants}
          leases={leases}
          onClose={onClose}
          onSubmit={(d) => submit(() => addTenant(d), `Tenant ${d.name} added`, 'Failed to add tenant', '/tenants')}
        />
      );
    case 'lease':
      return (
        <AddLeaseModal
          properties={properties}
          tenants={tenants}
          units={units}
          onClose={onClose}
          onCreate={(d) => submit(() => addLease(d), 'Lease created', 'Failed to create lease')}
        />
      );
    case 'payment':
      return (
        <RecordPaymentModal
          mode="add"
          title="Record Payment"
          initial={{
            tenantId: '', propertyId: properties[0]?.id ?? '', amount: 0,
            date: toIsoDay(new Date()), method: 'Bank', status: 'Paid',
          }}
          properties={properties}
          tenants={tenants}
          onClose={onClose}
          onSubmit={(d) =>
            submit(() => addPayment(d), `Payment of $${d.amount.toLocaleString('en-US')} recorded`, 'Failed to record payment')
          }
        />
      );
    case 'maintenance':
      return (
        <NewMaintenanceModal
          properties={properties}
          units={units}
          tenants={tenants}
          staff={staff}
          onClose={onClose}
          onCreate={(d) => submit(() => addMaintenance(d), 'Maintenance request created', 'Failed to create maintenance request')}
        />
      );
    case 'document':
      return (
        <UploadDocumentModal
          properties={properties}
          tenants={tenants}
          onClose={onClose}
          onCreate={(d, file) => submit(() => addDocument(d, file), 'Document uploaded successfully', 'Failed to upload document')}
        />
      );
    default:
      return null;
  }
}
