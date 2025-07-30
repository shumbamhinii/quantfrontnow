import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, Mail, Printer } from 'lucide-react';

interface InvoiceData {
  type: 'invoice' | 'quotation';
  number: string;
  date: string;
  dueDate?: string;
  validUntil?: string;
  customer: {
    name: string;
    address: string;
    email: string;
    vatNumber?: string;
  };
  company: {
    name: string;
    address: string;
    email: string;
    phone: string;
    vatNumber: string;
    regNumber: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    amount: number;
  }>;
  subtotal: number;
  vatAmount: number;
  total: number;
  notes?: string;
}

interface InvoicePreviewProps {
  data: InvoiceData;
  onDownload: () => void;
  onEmail: () => void;
  onPrint: () => void;
}

export function InvoicePreview({
  data,
  onDownload,
  onEmail,
  onPrint
}: InvoicePreviewProps) {
  return (
    <div className='space-y-6'>
      {/* Action Buttons */}
      <div className='flex justify-end gap-2'>
        <Button variant='outline' onClick={onPrint}>
          <Printer className='h-4 w-4 mr-2' />
          Print
        </Button>
        <Button variant='outline' onClick={onEmail}>
          <Mail className='h-4 w-4 mr-2' />
          Email
        </Button>
        <Button onClick={onDownload}>
          <Download className='h-4 w-4 mr-2' />
          Download PDF
        </Button>
      </div>

      {/* Invoice Preview */}
      <Card className='max-w-4xl mx-auto'>
        <CardContent className='p-8'>
          {/* Header */}
          <div className='flex justify-between items-start mb-8'>
            <div>
              <h1 className='text-3xl font-bold text-primary'>
                {data.company.name}
              </h1>
              <div className='text-sm text-muted-foreground mt-2'>
                <p>{data.company.address}</p>
                <p>Email: {data.company.email}</p>
                <p>Phone: {data.company.phone}</p>
                <p>VAT No: {data.company.vatNumber}</p>
                <p>Reg No: {data.company.regNumber}</p>
              </div>
            </div>
            <div className='text-right'>
              <h2 className='text-2xl font-bold text-primary mb-2'>
                {data.type === 'invoice' ? 'TAX INVOICE' : 'QUOTATION'}
              </h2>
              <div className='text-sm'>
                <p>
                  <strong>
                    {data.type === 'invoice' ? 'Invoice' : 'Quote'} #:
                  </strong>{' '}
                  {data.number}
                </p>
                <p>
                  <strong>Date:</strong>{' '}
                  {new Date(data.date).toLocaleDateString('en-ZA')}
                </p>
                {data.dueDate && (
                  <p>
                    <strong>Due Date:</strong>{' '}
                    {new Date(data.dueDate).toLocaleDateString('en-ZA')}
                  </p>
                )}
                {data.validUntil && (
                  <p>
                    <strong>Valid Until:</strong>{' '}
                    {new Date(data.validUntil).toLocaleDateString('en-ZA')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className='mb-8'>
            <h3 className='text-lg font-semibold mb-2'>Bill To:</h3>
            <div className='bg-muted p-4 rounded'>
              <p className='font-semibold'>{data.customer.name}</p>
              <p className='text-sm text-muted-foreground'>
                {data.customer.address}
              </p>
              <p className='text-sm text-muted-foreground'>
                Email: {data.customer.email}
              </p>
              {data.customer.vatNumber && (
                <p className='text-sm text-muted-foreground'>
                  VAT No: {data.customer.vatNumber}
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className='mb-8'>
            <table className='w-full'>
              <thead>
                <tr className='border-b-2 border-primary'>
                  <th className='text-left py-2'>Description</th>
                  <th className='text-center py-2'>Qty</th>
                  <th className='text-right py-2'>Unit Price</th>
                  <th className='text-center py-2'>VAT%</th>
                  <th className='text-right py-2'>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={index} className='border-b'>
                    <td className='py-3'>{item.description}</td>
                    <td className='text-center py-3'>{item.quantity}</td>
                    <td className='text-right py-3'>
                      R{item.unitPrice.toFixed(2)}
                    </td>
                    <td className='text-center py-3'>{item.vatRate}%</td>
                    <td className='text-right py-3'>
                      R{item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className='flex justify-end mb-8'>
            <div className='w-80'>
              <div className='flex justify-between py-2'>
                <span>Subtotal:</span>
                <span>R{data.subtotal.toFixed(2)}</span>
              </div>
              <div className='flex justify-between py-2'>
                <span>VAT (15%):</span>
                <span>R{data.vatAmount.toFixed(2)}</span>
              </div>
              <Separator className='my-2' />
              <div className='flex justify-between py-2 text-lg font-bold'>
                <span>Total:</span>
                <span>R{data.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {data.notes && (
            <div className='mb-8'>
              <h3 className='text-lg font-semibold mb-2'>Notes:</h3>
              <p className='text-sm text-muted-foreground'>{data.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className='text-center text-sm text-muted-foreground border-t pt-4'>
            <p>Thank you for your business!</p>
            {data.type === 'invoice' && (
              <p className='mt-2'>
                Payment is due within 30 days of invoice date.
              </p>
            )}
            {data.type === 'quotation' && (
              <p className='mt-2'>
                This quotation is valid for 30 days from the date above.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
