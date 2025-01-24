import {gameDB as db} from "@/lib/db/connection";
import {inventoryequipment} from './schema';
import {inArray, type InferSelectModel} from 'drizzle-orm';

export type SelectEquipment = InferSelectModel<typeof inventoryequipment>;

export async function findEquipmentsByItemIds(itemIds: number[]): Promise<SelectEquipment[]> {
  if (!itemIds.length) return [];

  return await db.query.inventoryequipment.findMany({
    where: inArray(inventoryequipment.inventoryitemid, itemIds),
  });
} 