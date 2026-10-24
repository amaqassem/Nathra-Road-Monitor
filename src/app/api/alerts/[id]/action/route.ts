import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// استلام أو حل تنبيه محدد
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body as { action: "acknowledge" | "resolve" };

    if (!action) {
      return NextResponse.json({ error: "action required" }, { status: 400 });
    }

    const newStatus = action === "acknowledge" ? "acknowledged" : "resolved";

    const updated = await db.alert.update({
      where: { id },
      data: { status: newStatus },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Alert action error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
