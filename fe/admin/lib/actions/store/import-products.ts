'use server';

import { db } from "@/lib/db/connection";
import { cashshop } from "@/lib/db/schema";
import * as XLSX from 'xlsx';
import { sql } from "drizzle-orm";

function nullIfEmpty(value: any): any {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return value;
}

function parseDate(value: any): Date | null {
  if (!value) return null;
  
  try {
    if (typeof value === 'number' || !isNaN(Number(value))) {
      const excelDate = Number(value);
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      const date = new Date(Math.round((excelDate - 25569) * millisecondsPerDay));
      return isNaN(date.getTime()) ? null : date;
    }
    
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export async function importProducts(file: File) {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const products = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

    const result = await db.transaction(async (tx) => {
        let count = 0;
        for (const product of products) {
          const {
            id, title, desc, categoryId, itemId, itemIco, count: itemCount,
            price, currency, display, canBuy, receiveMethod, banGift,
            createTime, saleStartTime, saleEndTime, stock, rank,
            limitGroup, userLimit, charLimit, expiration, extend
          } = product as any;
          console.log(title, createTime, parseDate(createTime));
  
          if (!id || !title || !itemId || !price) {
            throw new Error(`行 ${count + 1}: ID、标题、物品ID和价格为必填字段`);
          }
  
          await tx.execute(sql`
            INSERT INTO ${cashshop} (
              id, title, \`desc\`, category, itemId, itemIco, count,
              price, currency, display, canBuy, receiveMethod, banGift,
              create_time, start_sale_time, end_sale_time, amount, \`rank\`,
              limit_group, user_limit, char_limit, expiration, extend
            ) VALUES (
              ${Number(id)}, 
              ${title}, 
              ${nullIfEmpty(desc)}, 
              ${nullIfEmpty(categoryId)}, 
              ${Number(itemId)}, 
              ${nullIfEmpty(itemIco)}, 
              ${Number(itemCount) || 1},
              ${Number(price)}, 
              ${currency || '点券'}, 
              ${Number(display) || 0}, 
              ${Number(canBuy) || 1}, 
              ${Number(receiveMethod) || 0}, 
              ${Number(banGift) || 0},
              ${parseDate(createTime) || new Date()},
              ${parseDate(saleStartTime)},
              ${parseDate(saleEndTime)},
              ${nullIfEmpty(stock)}, 
              ${Number(rank) || 0},
              ${nullIfEmpty(limitGroup)}, 
              ${nullIfEmpty(userLimit)}, 
              ${nullIfEmpty(charLimit)}, 
              ${nullIfEmpty(expiration)}, 
              ${nullIfEmpty(extend)}
            )
            ON DUPLICATE KEY UPDATE
              title = VALUES(title),
              \`desc\` = VALUES(\`desc\`),
              category = VALUES(category),
              itemId = VALUES(itemId),
              itemIco = VALUES(itemIco),
              count = VALUES(count),
              price = VALUES(price),
              currency = VALUES(currency),
              display = VALUES(display),
              canBuy = VALUES(canBuy),
              receiveMethod = VALUES(receiveMethod),
              banGift = VALUES(banGift),
              start_sale_time = VALUES(start_sale_time),
              end_sale_time = VALUES(end_sale_time),
              amount = VALUES(amount),
              \`rank\` = VALUES(\`rank\`),
              limit_group = VALUES(limit_group),
              user_limit = VALUES(user_limit),
              char_limit = VALUES(char_limit),
              expiration = VALUES(expiration),
              extend = VALUES(extend)
          `);
          count++;
        }
        return count;
    });
    
    return {
      count: result,
    };
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
} 