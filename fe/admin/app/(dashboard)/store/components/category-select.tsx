'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {useRouter, useSearchParams} from "next/navigation";

interface CategorySelectProps {
  categories: Map<number, { id: number; name: string }>;
  currentCategory?: string;
}

export function CategorySelect({categories, currentCategory}: CategorySelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('category');
    } else {
      params.set('category', value);
    }
    router.push(`/store?${params.toString()}`);
  };

  return (
    <Select value={currentCategory || 'all'} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select Category"/>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">All</SelectItem>
          {Array.from(categories.values()).map((category) => (
            <SelectItem key={category.id} value={category.id.toString()}>
              {category.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
} 