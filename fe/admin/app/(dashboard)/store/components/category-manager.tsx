'use client';

import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { CategoryDialog } from "./category-dialog";
import { SelectProductCategory } from "@/lib/db/product-category";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";

interface CategoryManagerProps {
  categories: SelectProductCategory[];
  onCreate: (name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onToggleDisplay: (id: number, display: boolean) => Promise<void>;
}

export function CategoryManager({
  categories,
  onCreate,
  onDelete,
  onToggleDisplay,
}: CategoryManagerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        size="sm"
        variant="outline"
        className="h-8 gap-1"
        onClick={() => setIsOpen(true)}
      >
        <Settings className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          Categories
        </span>
      </Button>

      <CategoryDialog
        categories={categories}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onCreate={onCreate}
        onDelete={onDelete}
        onToggleDisplay={onToggleDisplay}
      />
      <Toaster />
    </>
  );
} 