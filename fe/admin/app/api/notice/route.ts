import { db } from "@/lib/db/connection";
import { notice } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { mustAuth } from "../utils";

export async function GET() {
  const response = await mustAuth();
  if (response) {
    return response;
  }
  try {
    const notices = await db.select().from(notice).orderBy(desc(notice.createTime));
    return NextResponse.json(notices);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const response = await mustAuth();
  if (response) {
    return response;
  }
  try {
    const body = await request.json();
    const result = await db.insert(notice).values({
      ...body,
      createTime: new Date(),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
  }
} 