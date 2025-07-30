import React, { useState } from 'react'; // Added React import
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
// Removed unused 'Edit' import from lucide-react

interface TransactionsListProps {
  type: 'sales' | 'quotations' | 'purchases';
}

export function TransactionsList ({ type }: TransactionsListProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const getTitle = () => {
    switch (type) {
      case 'sales':
        return 'Sales/Quotations Transactions';
      case 'quotations':
        return 'Quotations Transactions';
      case 'purchases':
        return 'Purchase Transactions';
      default:
        return 'Transactions';
    }
  };

  const getHeaderColumn = () => {
    switch (type) {
      case 'purchases':
        return 'Supplier';
      default:
        return 'Customer';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getTitle()}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <Label htmlFor='start-date'>Start Date</Label>
            <Input
              id='start-date'
              type='date'
              value={startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor='end-date'>End Date</Label>
            <Input
              id='end-date'
              type='date'
              value={endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor='type'>Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder='-- Select --' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='invoice'>Invoice</SelectItem>
                <SelectItem value='quote'>Quote</SelectItem>
                {type === 'purchases' && (
                  <SelectItem value='grn'>GRN</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-end'>
            <Button className='w-full'>Search</Button>
          </div>
        </div>

        <div className='border rounded-lg'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>{getHeaderColumn()}</TableHead>
                <TableHead>Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='text-center py-8 text-muted-foreground'
                >
                  No transactions found
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
