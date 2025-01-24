import {Metadata} from "next";
import Form from './create-form';
import {getProductItemCategories} from "@/lib/db/product-category";

export const metadata: Metadata = {
  title: 'Create Product',
};

export default async function Page() {
  const categories = await getProductItemCategories();
  const categoryArray = Array.from(categories.values());

  return (
    <main>
      <Form categories={categoryArray}/>
    </main>
  );
}