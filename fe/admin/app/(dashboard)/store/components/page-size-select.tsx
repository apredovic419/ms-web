'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {useRouter, useSearchParams} from "next/navigation";

const pageSizes = [5, 10, 20, 50, 100];

interface PageSizeSelectProps {
  currentSize: number;
}

export function PageSizeSelect({currentSize}: PageSizeSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('size', value);
    params.delete('offset');
    router.push(`/store?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Page Size</span>
      <Select value={currentSize.toString()} onValueChange={onValueChange}>
        <SelectTrigger className="w-[80px]">
          <SelectValue/>
        </SelectTrigger>
        <SelectContent>
          {pageSizes.map((size) => (
            <SelectItem key={size} value={size.toString()}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 