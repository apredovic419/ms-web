import {NextResponse} from "next/server";
import {auth} from "@/lib/auth";

export const mustAuth = async () => {
  const session = await auth()
  if (!session) {
    return NextResponse.json({
      success: false,
      error: "Forbidden",
    }, {status: 403});
  }
}