import {NextRequest} from "next/server";
import {db} from "@/lib/db/connection";
import {and, between, desc, eq, like, sql} from "drizzle-orm";
import {shoppinglog} from "@/lib/db/schema";
import {mustAuth} from "../utils";

export async function GET(request: NextRequest) {
  const response = await mustAuth();
  if (response) {
    return response;
  }

  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const accountId = searchParams.get("accountId");
  const characterId = searchParams.get("characterId");
  const characterName = searchParams.get("characterName");
  const itemId = searchParams.get("itemId");
  const itemName = searchParams.get("itemName");
  const size = searchParams.get("size");
  const offset = searchParams.get("offset");

  let whereClause: any[] = [];

  if (from && to) {
    whereClause.push(between(shoppinglog.createTime, new Date(from), new Date(to)));
  }

  if (accountId) {
    whereClause.push(eq(shoppinglog.user, accountId));
  }

  if (characterId) {
    whereClause.push(eq(shoppinglog.charId, parseInt(characterId)));
  }

  if (characterName) {
    whereClause.push(like(shoppinglog.character, `%${characterName}%`));
  }

  if (itemId) {
    whereClause.push(eq(shoppinglog.shopId, parseInt(itemId)));
  }

  if (itemName) {
    whereClause.push(like(shoppinglog.shopName, `%${itemName}%`));
  }

  const hasFilters = whereClause.length > 0;
  const condition = hasFilters ? and(...whereClause) : undefined;

  // 获取总数
  const [{count}] = await db.select({
    count: sql<number>`count(*)`,
  })
    .from(shoppinglog)
    .where(condition);

  // 如果有过滤条件，返回所有数据
  if (hasFilters) {
    const orders = await db.select()
      .from(shoppinglog)
      .where(condition)
      .orderBy(shoppinglog.createTime);

    return Response.json({
      data: orders,
      total: count,
    });
  }

  // 如果没有过滤条件，使用分页
  const orders = await db.select()
    .from(shoppinglog)
    .where(condition)
    .orderBy(desc(shoppinglog.createTime))
    .limit(size ? parseInt(size) : 10)
    .offset(offset ? parseInt(offset) : 0);

  return Response.json({
    data: orders,
    total: count,
  });
} 