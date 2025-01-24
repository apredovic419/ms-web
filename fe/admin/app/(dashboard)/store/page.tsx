import {Tabs, TabsContent} from '@/components/ui/tabs';
import {PlusCircle} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {ProductsTable} from './components/products-table';
import Link from "next/link";
import {getProducts} from "@/lib/db/cashshop";
import {getProductItemCategories} from "@/lib/db/product-category";
import {ExportButton} from "./components/export-button";
import {ImportButton} from "./components/import-button";
import {CategorySelect} from "./components/category-select";
import {CategoryManager} from "./components/category-manager";
import {CreateCategory, DeleteCategory, ToggleDisplay} from "@/lib/actions/store/product-category";

export default async function Page(
  props: {
    searchParams: Promise<{ query: string; offset: string, category?: string, size?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const search = searchParams.query ?? '';
  const offset = searchParams.offset ?? 0;
  const category = searchParams.category;
  const size = Number(searchParams.size) || 5;

  const [productsResult, categories] = await Promise.all([
    getProducts(search, Number(offset), category, size),
    getProductItemCategories(),
  ]);
  const {products, newOffset, totalProducts} = productsResult;
  const categoriesArray = Array.from(categories.values());

  return (
    <Tabs defaultValue="products">
      <div className="flex items-center gap-4">
        <CategorySelect categories={categories} currentCategory={category}/>
        <div className="ml-auto flex items-center gap-2">
          <ImportButton/>
          <ExportButton products={products}/>
          <CategoryManager
            categories={categoriesArray}
            onCreate={CreateCategory}
            onDelete={DeleteCategory}
            onToggleDisplay={ToggleDisplay}
          />
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5"/>
            <Link href="/store/create">
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Product
            </span>
            </Link>
          </Button>
        </div>
      </div>
      <TabsContent value="products" className="mt-4">
        <ProductsTable
          products={products}
          productCategories={categories}
          offset={newOffset ?? 0}
          totalProducts={totalProducts}
          pageSize={size}
        />
      </TabsContent>
    </Tabs>
  );
}
