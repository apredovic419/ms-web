'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState, useTransition } from "react";
import { SelectProduct } from "@/lib/db/cashshop";
import { useToast } from "@/components/hooks/use-toast";
import { getAllProducts } from "@/lib/actions/store/export-products";
import { Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';

interface ExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentProducts: SelectProduct[];
}

export function ExportDialog({ isOpen, onOpenChange, currentProducts }: ExportDialogProps) {
  const [exportType, setExportType] = useState<'current' | 'all'>('current');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleExport = () => {
    startTransition(async () => {
      try {
        let products: SelectProduct[] = [];
        if (exportType === 'current') {
          products = currentProducts;
        } else {
          products = await getAllProducts();
        }

        const worksheet = XLSX.utils.json_to_sheet(products.map(product => ({
          id: product.id,
          title: product.title,
          desc: product.desc,
          categoryId: product.categoryId,
          itemId: product.itemId,
          itemIco: product.itemIco,
          count: product.count,
          price: product.price,
          currency: product.currency,
          display: product.display,
          canBuy: product.canBuy,
          receiveMethod: product.receiveMethod,
          banGift: product.banGift,
          createTime: product.createTime,
          saleStartTime: product.saleStartTime,
          saleEndTime: product.saleEndTime,
          stock: product.stock,
          rank: product.rank,
          limitGroup: product.limitGroup,
          userLimit: product.userLimit,
          charLimit: product.charLimit,
          expiration: product.expiration,
          extend: product.extend,
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

        const fileName = `products_${exportType === 'current' ? 'current' : 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        toast({
          description: "Export completed successfully",
          className: "bg-green-500 text-white",
        });

        onOpenChange(false);
      } catch (error) {
        console.error('Export failed:', error);
        toast({
          variant: "destructive",
          description: "Failed to export data",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Product Data</DialogTitle>
          <DialogDescription>
            Please select the data range to export
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={exportType}
          onValueChange={(value: 'current' | 'all') => setExportType(value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="current" id="current" />
            <Label htmlFor="current">
              Export current page data ({currentProducts.length} items)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all">Export all data</Label>
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              'Export'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 