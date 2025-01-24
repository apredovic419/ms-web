import {db} from "@/lib/db/connection";
import {shopCategory} from "@/lib/db/schema";
import {eq, max} from "drizzle-orm";

export type SelectProductCategory = typeof shopCategory.$inferSelect;

const productCategoriesCache = new Map<number, SelectProductCategory>();

export async function getProductCategories(): Promise<SelectProductCategory[]> {
  return db.select().from(shopCategory);
}

export async function getProductItemCategories() {
  if (productCategoriesCache.size === 0) {
    const categories = await db.select().from(shopCategory);
    categories.forEach(category => {
      productCategoriesCache.set(category.id, category);
    });
  }
  return productCategoriesCache;
}

export function clearProductCategoriesCache() {
  productCategoriesCache.clear();
}

// 获取最大ID
async function getMaxCategoryId(): Promise<number> {
  const result = await db.select({
    maxId: max(shopCategory.id)
  }).from(shopCategory);
  return result[0].maxId || 0;
}

// 创建新分类
export async function createCategory(name: string) {
  const maxId = await getMaxCategoryId();
  const result = await db.insert(shopCategory).values({
    id: maxId + 1,
    name,
    display: true
  });
  clearProductCategoriesCache();
  return result;
}

// 删除分类
export async function deleteCategory(id: number) {
  const result = await db.delete(shopCategory).where(eq(shopCategory.id, id));
  clearProductCategoriesCache();
  return result;
}

// 更新分类显示状态
export async function updateCategoryDisplay(id: number, display: boolean) {
  const result = await db.update(shopCategory)
    .set({ display })
    .where(eq(shopCategory.id, id));
  clearProductCategoriesCache();
  return result;
}