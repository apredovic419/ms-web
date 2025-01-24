import { db } from "@/lib/db/connection";
import { notice } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { mustAuth } from "../../utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const response = await mustAuth();
  if (response) {
    return response;
  }
  try {
    const id = (await params).id;
    const result = await db
      .select()
      .from(notice)
      .where(eq(notice.id, parseInt(id)))
      .limit(1);
    
    if (!result.length) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notice" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const response = await mustAuth();
  if (response) {
    return response;
  }
  try {
    const body = await request.json();
    const id = (await params).id;
    const result = await db
      .update(notice)
      .set(body)
      .where(eq(notice.id, parseInt(id)));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notice" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    await db.delete(notice).where(eq(notice.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete notice" }, { status: 500 });
  }
} 