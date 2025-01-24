import {NextRequest, NextResponse} from "next/server";
import {findEquipmentsByItemIds} from "@/lib/db/equipment";
import {mustAuth} from "../utils";

export async function POST(request: NextRequest) {
  const response = await mustAuth();
  if (response) {
    return response;
  }
  try {
    const body = await request.json();
    const {itemIds} = body;

    if (!Array.isArray(itemIds)) {
      return NextResponse.json({error: 'Invalid itemIds'}, {status: 400});
    }

    const equipment = await findEquipmentsByItemIds(itemIds);
    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
} 