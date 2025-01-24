'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {File} from 'lucide-react';
import {ExportDialog} from './export-dialog';
import {SelectProduct} from '@/lib/db/cashshop';

export function ExportButton({products}: { products: SelectProduct[] }) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1"
        onClick={() => setIsExportDialogOpen(true)}
      >
        <File className="h-3.5 w-3.5"/>
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          Export
        </span>
      </Button>
      <ExportDialog
        isOpen={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        currentProducts={products}
      />
    </>
  );
} 