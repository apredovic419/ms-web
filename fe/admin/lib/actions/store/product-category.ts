'use server'

import {revalidatePath} from "next/cache";
import {createCategory, deleteCategory, updateCategoryDisplay} from "@/lib/db/product-category";


export async function CreateCategory(name: string) {
    await createCategory(name);
    revalidatePath('/store');
}

export async function DeleteCategory(id: number) {
    await deleteCategory(id);
    revalidatePath('/store');
}

export async function ToggleDisplay(id: number, display: boolean) {
    await updateCategoryDisplay(id, display);
    revalidatePath('/store');
}