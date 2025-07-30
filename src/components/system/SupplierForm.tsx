import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';

// This interface reflects the *full* Supplier object, including optional id and source-specific fields
interface Supplier {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  vatNumber?: string; // From /api/suppliers
  totalPurchased?: number; // Not editable in this form
  contactPerson?: string; // From /vendors
  taxId?: string; // From /vendors
  source?: 'api/suppliers' | 'vendors'; // To track the origin
}

// This interface defines the data structure that the form will *emit* when saved.
// It aligns with the /api/suppliers endpoint's expected payload for creation/update.
interface SupplierFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  vatNumber?: string; // This field will capture both vatNumber and taxId from the UI
}

interface SupplierFormProps {
  supplier?: Supplier; // The existing supplier data passed in for editing
  // The onSave prop now expects data that matches what the backend expects for creation/update
  onSave: (supplierData: SupplierFormData) => void;
  onCancel: () => void;
}

export function SupplierForm({
  supplier,
  onSave,
  onCancel
}: SupplierFormProps) {
  // Initialize formData with current supplier data or empty strings.
  // For vatNumber, prioritize supplier.vatNumber, then supplier.taxId.
  const [formData, setFormData] = useState<SupplierFormData>({
    name: supplier?.name || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    vatNumber: supplier?.vatNumber || supplier?.taxId || '' // Crucial: use taxId if vatNumber is missing
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pass only the data relevant for saving (excluding id, totalPurchased, contactPerson, taxId, source)
    // The `vatNumber` in formData will contain the value from either original vatNumber or taxId.
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='name'>Company Name *</Label>
          <Input
            id='name'
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor='email'>Email</Label> {/* Made optional in backend, so no '*' here */}
          <Input
            id='email'
            type='email'
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='phone'>Phone</Label>
          <Input
            id='phone'
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor='vatNumber'>VAT Number / Tax ID</Label> {/* Updated label */}
          <Input
            id='vatNumber'
            value={formData.vatNumber}
            onChange={e =>
              setFormData({ ...formData, vatNumber: e.target.value })
            }
          />
        </div>
      </div>

      <div>
        <Label htmlFor='address'>Address</Label>
        <Textarea
          id='address'
          value={formData.address}
          onChange={e => setFormData({ ...formData, address: e.target.value })}
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type='button' variant='outline' onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit'>{supplier ? 'Update' : 'Create'} Supplier</Button>
      </DialogFooter>
    </form>
  );
}
