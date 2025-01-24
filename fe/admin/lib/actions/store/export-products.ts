'use server';

import { SelectProduct } from "@/lib/db/cashshop";
import { db } from "@/lib/db/connection";
import { cashshop } from "@/lib/db/schema";

export async function getAllProducts(): Promise<SelectProduct[]> {
  return await db.select().from(cashshop);
} 