'use client';

import { Button } from '@/components/ui/button';
import { FileUp, Loader2 } from 'lucide-react';
import { useRef, useTransition } from 'react';
import { useToast } from "@/components/hooks/use-toast";
import { useRouter } from "next/navigation";
import { importProducts } from '@/lib/actions/store/import-products';

export function ImportButton() {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const result = await importProducts(file);
        
        toast({
          description: `Successfully imported ${result.count} items`,
          className: "bg-green-500 text-white",
        });
        
        router.refresh();
      } catch (error) {
        console.error('Import failed:', error);
        toast({
          variant: "destructive",
          description: error instanceof Error ? error.message : 'Import failed',
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
  };

  return (
    <>
      <input
        type="file"
        accept=".xlsx"
        onChange={handleImport}
        className="hidden"
        ref={fileInputRef}
      />
      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1"
        disabled={isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        {isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Importing...
            </span>
          </>
        ) : (
          <>
            <FileUp className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Import
            </span>
          </>
        )}
      </Button>
    </>
  );
} 