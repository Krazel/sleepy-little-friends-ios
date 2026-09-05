'use client';
import { Capacitor } from '@capacitor/core';
import { NativeSelect } from '@/components/ui/native-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
type Props = {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  id?: string;
  className?: string;
  'aria-label'?: string;
};
export function PreferenceSelect({
  value,
  onValueChange,
  options,
  id,
  className,
  'aria-label': label,
}: Props) {
  if (!Capacitor.isNativePlatform())
    return (
      <NativeSelect
        id={id}
        className={className}
        aria-label={label}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    );
  return (
    <div className={className}>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next !== null) onValueChange(next);
        }}
        items={options}
      >
        <SelectTrigger
          id={id}
          aria-label={label}
          className="ios-preference-select"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          alignItemWithTrigger={false}
          className="ios-preference-menu"
        >
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="ios-preference-option"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
