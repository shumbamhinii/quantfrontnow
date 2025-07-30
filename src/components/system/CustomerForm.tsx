import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DialogFooter } from '@/components/ui/dialog'

interface Customer {
  id?: string
  name: string
  email: string
  phone: string
  address: string
  vatNumber: string
}

interface CustomerFormProps {
  customer?: Customer
  onSave: (customer: Customer) => void
  onCancel: () => void
}

export function CustomerForm ({
  customer,
  onSave,
  onCancel
}: CustomerFormProps) {
  const [formData, setFormData] = useState<Customer>({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    vatNumber: customer?.vatNumber || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

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
          <Label htmlFor='email'>Email *</Label>
          <Input
            id='email'
            type='email'
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            required
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
          <Label htmlFor='vatNumber'>VAT Number</Label>
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
        <Button type='submit'>{customer ? 'Update' : 'Create'} Customer</Button>
      </DialogFooter>
    </form>
  )
}
