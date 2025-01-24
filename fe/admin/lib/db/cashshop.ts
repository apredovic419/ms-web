import {and, count, desc, eq, gte, like, lte, or} from "drizzle-orm";
import {db} from "./connection";
import {cashshop} from "./schema";

export type SelectProduct = typeof cashshop.$inferSelect;

/** Get products
 *
 * @param search
 * @param offset
 * @param categoryId
 * @param size
 */
export async function getProducts(
  search: string,
  offset: number,
  categoryId?: string,
  size: number = 5,
): Promise<{
  products: SelectProduct[];
  newOffset: number;
  totalProducts: number;
}> {
  if (offset === null) {
    return {products: [], newOffset: 0, totalProducts: 0};
  }

  let cond = null;
  if (search) {
    if (!isNaN(Number(search))) {
      cond = or(
        like(cashshop.title, `%${search}%`),
        eq(cashshop.itemId, Number(search)),
        eq(cashshop.id, Number(search)),
      );
    } else {
      cond = or(like(cashshop.title, `%${search}%`), like(cashshop.desc, `%${search}%`));
    }
  }
  if (categoryId) {
    if (cond) {
      cond = and(cond, eq(cashshop.categoryId, categoryId));
    } else {
      cond = eq(cashshop.categoryId, categoryId);
    }
  }
  const totalQuery = cond ? db.select({count: count()}).from(cashshop).where(cond) : db.select({count: count()}).from(cashshop);
  const query = cond ? db.select().from(cashshop).where(cond) : db.select().from(cashshop);
  let totalProducts = await totalQuery;
  let moreProducts = await query.limit(size).offset(offset);
  let newOffset = offset + size;

  return {
    products: moreProducts,
    newOffset,
    totalProducts: totalProducts[0].count
  };
}

/** Insert product
 *
 * @param product
 */
export async function insertProduct(product: Omit<SelectProduct, 'id'>) {
  const categoryId = Number(product.categoryId as string);
  const pkStart = categoryId * 10000;
  const pkEnd = pkStart + 9999;
  const row = await db.select().from(cashshop).where(
    and(
      gte(cashshop.id, pkStart),
      lte(cashshop.id, pkEnd))
  ).orderBy(desc(cashshop.id)).limit(1);
  let index = pkStart - 1
  if (row.length > 0) {
    index = row[0].id;
  }
  if (index >= pkEnd) {
    throw new Error('Category is full');
  }
  return db.insert(cashshop).values({
      ...product,
      id: index + 1,
    }
  );
}

/** Update product
 *
 * @param product
 */
export async function updateProduct(product: SelectProduct) {
  const {createTime, ...updateData} = product;
  return db.update(cashshop).set(updateData).where(eq(cashshop.id, product.id));
}

/** Fetch product by id
 *
 * @param id - product id
 */
export async function fetchProductById(id: number): Promise<{
  product: SelectProduct;
}> {
  const product = await db.select().from(cashshop).where(eq(cashshop.id, id));
  return {product: product[0]};
}

/** Set display product by id
 *
 * @param id
 * @param display
 */
export async function setDisplayProductById(id: number, display: boolean) {
  await db.update(cashshop).set({display: display ? 1 : 0}).where(eq(cashshop.id, id));
}

/** Delete product by id
 *
 * @param id - product id
 */
export async function deleteProductById(id: number): Promise<void> {
  await db.delete(cashshop).where(eq(cashshop.id, id));
}