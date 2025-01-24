import {Metadata} from "next";
import Form from './update-form';
import {fetchProductById} from "@/lib/db/cashshop";
import {getProductItemCategories} from "@/lib/db/product-category";

export const metadata: Metadata = {
  title: 'Edit Product',
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const categories = await getProductItemCategories();
  const categoryArray = Array.from(categories.values());
  const {product} = await fetchProductById(Number(id));

  return (
    <main>
      <Form product={product} categories={categoryArray}/>
    </main>
  );
}