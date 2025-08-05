// components/SearchableAccountSelect.tsx
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface Account {
  id: string;
  name: string;
  type: string;
}

export const SearchableAccountSelect = ({
  value,
  onChange,
  accounts,
}: {
  value: string;
  onChange: (id: string) => void;
  accounts: Account[];
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = accounts.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    a.type.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[150px] justify-start truncate">
          {accounts.find(a => a.id === value)?.name || 'Select Account'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-2">
        <Input
          placeholder="Search account..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-[200px] overflow-y-auto space-y-1">
          {filtered.map(acc => (
            <Button
              key={acc.id}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                onChange(acc.id);
                setOpen(false);
              }}
            >
              {acc.name} ({acc.type})
            </Button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground px-2 py-1">No results</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
