'use client';

import Image from '@/components/ui/image';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {MoreHorizontal} from 'lucide-react';
import {TableCell, TableRow} from '@/components/ui/table';
import ConfirmDialog from "./dialog";
import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {SelectProduct} from "@/lib/db/cashshop";
import {SelectProductCategory} from "@/lib/db/product-category";
import { useToast } from "@/components/hooks/use-toast";
import { toggleDisplay, deleteProduct } from '@/lib/actions/store/update-product';


function productDuration(product: SelectProduct): string {
  if (product.saleStartTime && product.saleEndTime) {
    return `${product.saleStartTime.toLocaleDateString("en-US")} - ${product.saleEndTime.toLocaleDateString("en-US")}`;
  } else if (product.saleStartTime) {
    return `Start: ${product.saleStartTime.toLocaleDateString("en-US")}`;
  } else if (product.saleEndTime) {
    return `End: ${product.saleEndTime.toLocaleDateString("en-US")}`;
  }
  return '';
}

function productIco(product: SelectProduct): string {
  if (product.itemIco !== null) {
    if (product.itemIco.substring(0, 4) === 'http') {
      return product.itemIco;
    } else {
      return `data:image/png;base64,${product.itemIco}`;
    }
  }
  return `https://maplestory.io/api/GMS/253/item/${product.itemId}/iconRaw`;
}


export function Product({product, category}: {
  product: SelectProduct,
  category?: SelectProductCategory
}) {
  const categoryName = category?.name || product.categoryId;

  const [hideModalIsOpen, setHideModalIsOpen] = useState(false);
  const [isDisplay, setDisplay] = useState(product.display === 1);
  const [modalText, setModalText] = useState<{
    title: string;
    description: string | React.JSX.Element;
  }>({
    title: '',
    description: ''
  });
  const router = useRouter();
  const { toast } = useToast();

  const handleDisplayToggle = () => {
    setModalText({
      title: `${isDisplay ? 'Hide' : 'Show'} Product`,
      description: (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Image
              alt="Product image"
              className="aspect-square rounded-md object-cover"
              height="40"
              src={productIco(product)}
              width="40"
            />
            <div className="space-y-1">
              <div className="font-medium">{product.title}</div>
              <div className="text-sm text-muted-foreground">ID: {product.id}</div>
            </div>
          </div>
          <div className="space-y-1">
            <div>Are you sure you want to {isDisplay ? 'hide' : 'show'} this product?</div>
            <div className="text-muted-foreground text-sm">
              {isDisplay 
                ? 'Hidden products will not be visible in the store.' 
                : 'The product will be visible in the store after showing.'}
            </div>
          </div>
        </div>
      )
    });
    setHideModalIsOpen(true);
  };

  const handleDelete = () => {
    setModalText({
      title: 'Delete Product',
      description: (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md border border-destructive/50 p-1">
              <Image
                alt="Product image"
                className="aspect-square rounded-md object-cover"
                height="40"
                src={productIco(product)}
                width="40"
              />
            </div>
            <div className="space-y-1">
              <div className="font-medium">{product.title}</div>
              <div className="text-sm text-muted-foreground">ID: {product.id}</div>
            </div>
          </div>
          <div className="space-y-1 text-destructive">
            <div>This action will permanently delete the product and cannot be undone.</div>
            <div>Are you sure you want to continue?</div>
          </div>
        </div>
      )
    });
    setHideModalIsOpen(true);
  };

  const onHideConfirm = async () => {
    setHideModalIsOpen(false);
    try {
      await toggleDisplay(product.id, isDisplay ? 0 : 1);
      setDisplay(!isDisplay);
      toast({
        description: `Successfully ${isDisplay ? 'hidden' : 'displayed'} ${product.title}`,
        className: "bg-green-500 text-white",
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : 'Failed to update display status',
      });
    }
  };

  const onDeleteConfirm = async () => {
    setHideModalIsOpen(false);
    try {
      await deleteProduct(product.id);
      toast({
        description: `Successfully deleted ${product.title}`,
        className: "bg-green-500 text-white",
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : 'Failed to delete product',
      });
    }
  };

  return (
    <>
      <TableRow
        onDoubleClick={() => router.push(`/store/${product.id}/edit`)}
        className={isDisplay ? '' : 'bg-muted hover:bg-muted'}>
        <TableCell className={`font-medium ${!isDisplay && 'text-muted-foreground'}`}>
          {product.itemId}
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          <Image
            alt="Product image"
            className={`aspect-square rounded-md object-cover ${!isDisplay && 'grayscale'}`}
            height="32"
            src={productIco(product)}
            width="32"/>
        </TableCell>
        <TableCell className={`font-medium ${!isDisplay && 'text-muted-foreground'}`}>
          {product.title}
        </TableCell>
        <TableCell className={`hidden md:table-cell ${!isDisplay && 'text-muted-foreground'}`}>
          {product.desc}
        </TableCell>
        <TableCell>
          <Badge variant={isDisplay ? "outline" : "secondary"} className="capitalize">
            {categoryName}
          </Badge>
        </TableCell>
        <TableCell className={`hidden md:table-cell ${!isDisplay && 'text-muted-foreground'}`}>
          {`${product.price} ${product.currency}`}
        </TableCell>
        <TableCell className={`font-medium ${!isDisplay && 'text-muted-foreground'}`}>
          {product.count}
        </TableCell>
        <TableCell className={`font-medium ${!isDisplay && 'text-muted-foreground'}`}>
          {product.stock}
        </TableCell>
        <TableCell className={`hidden md:table-cell ${!isDisplay && 'text-muted-foreground'}`}>
          {productDuration(product)}
        </TableCell>
        <TableCell className={`hidden md:table-cell ${!isDisplay && 'text-muted-foreground'}`}>
          {product.createTime.toLocaleDateString("en-US")}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                aria-haspopup="true" 
                size="icon" 
                variant="ghost"
                className={!isDisplay ? 'text-muted-foreground hover:text-foreground' : ''}
              >
                <MoreHorizontal className="h-4 w-4"/>
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleDisplayToggle}>
                {isDisplay ? 'Hidden' : 'Display'}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/store/${product.id}/edit`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {hideModalIsOpen && (
        <tr>
          <td colSpan={11}>
            <ConfirmDialog
              isOpen={hideModalIsOpen}
              onOpenChange={setHideModalIsOpen}
              onConfirm={modalText.title === 'Delete Product' ? onDeleteConfirm : onHideConfirm}
              title={modalText.title}
              description={modalText.description}
            />
          </td>
        </tr>
      )}
    </>
  );
}
