'use client';

import {Table, TableBody, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {Product} from './product';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {SelectProduct} from "@/lib/db/cashshop";
import {SelectProductCategory} from "@/lib/db/product-category";
import {PageSizeSelect} from "./page-size-select";

interface ProductsTableProps {
  products: SelectProduct[];
  productCategories: Map<number, SelectProductCategory>;
  offset: number;
  totalProducts: number;
  pageSize: number;
}

export function ProductsTable({
                                products,
                                productCategories,
                                offset,
                                totalProducts,
                                pageSize
                              }: ProductsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathName = usePathname();

  const start = offset - pageSize + 1;
  const end = offset;

  function prevPage() {
    const params = new URLSearchParams(searchParams.toString());
    params.set('offset', (offset - pageSize * 2).toString());
    router.push(`${pathName}?${params.toString()}`);
  }

  function nextPage() {
    const params = new URLSearchParams(searchParams.toString());
    params.set('offset', offset.toString());
    router.push(`${pathName}?${params.toString()}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
        <CardDescription>
          Manage your products and view their sales performance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ItemId</TableHead>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Image</span>
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Desc</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden md:table-cell">Price</TableHead>
              <TableHead className="hidden md:table-cell">Count</TableHead>
              <TableHead className="hidden md:table-cell">Stock</TableHead>
              <TableHead className="hidden md:table-cell">Duration</TableHead>
              <TableHead className="hidden md:table-cell">Created at</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <Product key={product.id} product={product}
                       category={productCategories.get(Number.parseInt(product.categoryId as string))}/>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {start}-{end} of {totalProducts} products
          </p>
          <PageSizeSelect currentSize={pageSize}/>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevPage}
            disabled={offset <= pageSize}
          >
            <ChevronLeft className="h-4 w-4"/>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={offset >= totalProducts}
          >
            Next
            <ChevronRight className="h-4 w-4"/>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
