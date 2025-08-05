import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

export function SearchableCategorySelect({
  value,
  onChange,
  categories,
}: {
  value: string;
  onChange: (val: string) => void;
  categories: string[];
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = categories.filter(cat =>
    cat.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[150px] justify-start truncate">
          {value || 'Select Category'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-2">
        <Input
          placeholder="Search category..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-[200px] overflow-y-auto">
          {filtered.map(cat => (
            <Button
              key={cat}
              variant="ghost"
              className="w-full justify-start text-left"
              onClick={() => {
                onChange(cat);
                setOpen(false);
              }}
            >
              {cat}
            </Button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">No categories found.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
