'use server';

import {z} from 'zod';
import {redirect} from "next/navigation";
import {updateProduct as dbUpdateProduct} from "@/lib/db/cashshop";
import {getProductItemCategories} from "@/lib/db/product-category";
import {currencyList, deliveryMethodList} from "@/lib/definitions";
import {sql} from "drizzle-orm";
import {db} from "@/lib/db/connection";
import {cashshop} from "@/lib/db/schema";


async function isValidCategoryId(id: string | number): Promise<boolean> {
  const categories = await getProductItemCategories();
  return categories.has(Number(id));
}

const isValidJson = (value: string | null | undefined) => {
  if (value === null || value === undefined || value.trim() === "") return true;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};


const FormSchema = z.object({
  id: z.coerce.number(), //  编辑需要id
  itemId: z.coerce.number(),
  itemIco: z.string().trim().nullable(),
  title: z.string().trim().min(1, 'Title is required').max(16, 'Title must be 16 characters or less'),
  categoryId: z.string().refine(
    async (id) => await isValidCategoryId(id),
    {message: "Please select a valid category."}
  ),
  desc: z.string().trim().max(64, 'Description must be 64 characters or less').nullable(),
  receiveMethod: z.coerce.number().refine(
    (value) => deliveryMethodList.some((method) => method.id === value),
    {
      message: 'Please select a valid delivery method.',
    }
  ),
  currency: z.string().refine(
    (value) => currencyList.some((currency) => currency.id === value),
    {
      message: 'Please select a valid currency.',
    }
  ),
  price: z.coerce.number().int(),
  rank: z.coerce.number().int().default(0),
  count: z.coerce.number().int().nonnegative({message: 'Please enter a valid count.'}),
  canBuy: z.coerce.number().int().refine(
    (value) => value === 0 || value === 1,
    {
      message: 'Please enter a valid value for purchasable.',
    }
  ),
  banGift: z.coerce.number().int().refine(
    (value) => value === 0 || value === 1,
    {
      message: 'Please enter a valid value for gifting.',
    }
  ),
  display: z.coerce.number().int().refine(
    (value) => value === 0 || value === 1,
    {
      message: 'Please enter a valid value for display.',
    }
  ),
  stock: z.coerce.number().int().nonnegative({message: 'Please enter a valid stock.'}).nullable(),
  saleStartTime: z.coerce.date().nullable(),
  saleEndTime: z.coerce.date().nullable(),
  createTime: z.coerce.date().default(() => new Date()),
  limitGroup: z.string().max(64).nullable().default(null),
  userLimit: z.coerce.number().int().nullable().default(null)
    .refine(
      (val) => {
        // 如果userLimit为空，则charLimit必须有值且大于0
        if (val === null) return true;
        return val > 0;
      },
      { message: 'Account purchase limit must be greater than 0' }
    ),
  charLimit: z.coerce.number().int().nullable().default(null)
    .refine(
      (val) => {
        // 如果charLimit为空，则userLimit必须有值且大于0
        if (val === null) return true;
        return val > 0;
      },
      { message: 'Character purchase limit must be greater than 0' }
    ),
  expiration: z.coerce.number().int().positive('Expiration must be a positive integer').nullable(),
  extend: z.string().nullable().refine(
    (v) => isValidJson(v),
    {message: "Invalid JSON string"}
  )
}).refine(
  (data) => {
    // 如果有任意一个限购字段有值，则至少要填写userLimit或charLimit中的一个
    if (data.limitGroup || data.userLimit || data.charLimit) {
      return (data.userLimit !== null && data.userLimit > 0) || 
             (data.charLimit !== null && data.charLimit > 0);
    }
    return true;
  },
  {
    message: 'Please set at least one of account purchase limit or character purchase limit, and the number must be greater than 0',
    path: ['userLimit'], // 错误信息会显示在userLimit字段下
  }
);


export type State = {
  errors?: Partial<Record<keyof z.infer<typeof FormSchema>, string[]>>;
  message?: string | null;
  values: any;
};

export async function updateProduct(state: State, formData: FormData) {
  const itemIco = formData.get('itemIco') as string || '/item-icon-blur.jpg';
  const validatedFields = await FormSchema.safeParseAsync({
    id: formData.get('id'),
    itemId: formData.get('itemId'),
    itemIco: itemIco === '/item-icon-blur.jpg' || itemIco.startsWith("https://maplestory.io") ? null : itemIco,
    title: formData.get('title'),
    categoryId: formData.get('categoryId'),
    desc: formData.get('desc'),
    receiveMethod: formData.get('receiveMethod'),
    currency: formData.get('currency'),
    price: formData.get('price'),
    rank: formData.get('rank'),
    count: formData.get('count'),
    canBuy: formData.get('purchasable') === 'on' ? 1 : 0,
    banGift: formData.get('gifting') === 'on' ? 0 : 1,
    display: formData.get('display') === 'on' ? 1 : 0,
    stock: formData.get('stock'),
    saleStartTime: formData.get('startTime') ? new Date(formData.get('startTime') as string).toLocaleString('en-US', {timeZone: 'Asia/Shanghai'}) : null,
    saleEndTime: formData.get('endTime') ? new Date(formData.get('endTime') as string).toLocaleString('en-US', {timeZone: 'Asia/Shanghai'}) : null,
    limitGroup: formData.get('limitGroup') || null,
    userLimit: formData.get('userLimit') || null,
    charLimit: formData.get('charLimit') || null,
    expiration: formData.get('expiration'),
    extend: formData.get('extend'),
  });

  if (!validatedFields.success) {
    console.log(validatedFields.error)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Product.',
      values: {...state.values, ...Object.fromEntries(formData)}, // 保留现有值
    };
  }

  await dbUpdateProduct(validatedFields.data); // 调用数据库更新函数

  redirect(`/store?query=${validatedFields.data.id}`); // 重定向到表单页面
}

export async function toggleDisplay(id: number, display: number) {
  try {
    await db.update(cashshop)
      .set({ display })
      .where(sql`id = ${id}`);
    return { success: true };
  } catch (error) {
    console.error('Toggle display failed:', error);
    throw new Error('Failed to toggle display status');
  }
}

export async function deleteProduct(id: number) {
  try {
    await db.delete(cashshop)
      .where(sql`id = ${id}`);
    return { success: true };
  } catch (error) {
    console.error('Delete failed:', error);
    throw new Error('Failed to delete product');
  }
}
