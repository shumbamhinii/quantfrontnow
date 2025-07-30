import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/utils/apiClient'; // ✅ Firebase-ready API client

interface InvoiceLineItem {
  id?: string;
  product_service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
}

interface InvoiceFormProps {
  invoice?: any;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export function InvoiceForm({ invoice, onClose, onSubmitSuccess }: InvoiceFormProps) {
  const [formData, setFormData] = useState({
    customer_id: invoice?.customer_id || '',
    invoice_date: invoice?.invoice_date || new Date().toISOString().split('T')[0],
    due_date: invoice?.due_date || '',
    currency: invoice?.currency || 'ZAR',
    status: invoice?.status || 'Draft',
    notes: invoice?.notes || '',
    line_items: invoice?.line_items || [],
  });
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await apiClient('/customers');
        setCustomers(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const updatedItems = [...formData.line_items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
      line_total:
        field === 'quantity' || field === 'unit_price'
          ? (field === 'quantity' ? value : updatedItems[index].quantity) *
            (field === 'unit_price' ? value : updatedItems[index].unit_price)
          : updatedItems[index].line_total,
    };
    setFormData({ ...formData, line_items: updatedItems });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [
        ...formData.line_items,
        {
          product_service_id: null,
          description: '',
          quantity: 1,
          unit_price: 0,
          tax_rate: 0,
          line_total: 0,
        },
      ],
    });
  };

  const removeLineItem = (index: number) => {
    const updatedItems = [...formData.line_items];
    updatedItems.splice(index, 1);
    setFormData({ ...formData, line_items: updatedItems });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        total_amount: formData.line_items.reduce((sum, item) => sum + item.line_total, 0),
      };
      if (invoice?.id) {
        await apiClient(`/api/invoices/${invoice.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/api/invoices', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      onSubmitSuccess();
    } catch (error) {
      console.error('Error submitting invoice:', error);
      alert('Failed to submit invoice. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Customer</Label>
        <Select
          value={formData.customer_id}
          onValueChange={(val) => setFormData({ ...formData, customer_id: val })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Invoice Date</Label>
          <Input
            type="date"
            value={formData.invoice_date}
            onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
          />
        </div>
        <div>
          <Label>Due Date</Label>
          <Input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Input
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Optional notes for this invoice"
        />
      </div>
      <div className="space-y-2">
        <Label>Line Items</Label>
        {formData.line_items.map((item: InvoiceLineItem, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder="Description"
              value={item.description}
              onChange={(e) =>
                handleLineItemChange(index, 'description', e.target.value)
              }
            />
            <Input
              type="number"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) =>
                handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
              }
            />
            <Input
              type="number"
              placeholder="Unit Price"
              value={item.unit_price}
              onChange={(e) =>
                handleLineItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)
              }
            />
            <Button
              type="button"
              variant="destructive"
              onClick={() => removeLineItem(index)}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" onClick={addLineItem}>
          + Add Line Item
        </Button>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : invoice?.id ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </div>
  );
}
