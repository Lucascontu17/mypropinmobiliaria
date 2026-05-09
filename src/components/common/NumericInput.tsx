import React from 'react';
import { useRegion } from '@/hooks/useRegion';
import { cn } from '@/lib/utils';

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string | undefined | null;
  onChange: (value: number) => void;
  className?: string;
}

/**
 * NumericInput — Un input que formatea miles en tiempo real según la región.
 * Útil para montos de dinero, precios y valores grandes.
 */
export function NumericInput({ value, onChange, className, ...props }: NumericInputProps) {
  const { formatInputNumber, parseInputNumber } = useRegion();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseInputNumber(rawValue);
    onChange(numericValue);
  };

  const displayValue = formatInputNumber(value);

  return (
    <input
      {...props}
      type="text"
      value={displayValue}
      onChange={handleChange}
      className={cn(
        "w-full rounded-lg ring-1 ring-inset ring-admin-border border-transparent px-3 py-2 text-sm focus:outline-none focus:border-renta-300 focus:ring-1 focus:ring-renta-200 transition-all",
        className
      )}
    />
  );
}
