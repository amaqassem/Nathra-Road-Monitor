import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const models = await db.aIModel.findMany({ orderBy: { status: "asc" } });
    return NextResponse.json(models);
  } catch (error) {
    console.error("AI models error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, threshold } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const data: any = {};
    if (status) data.status = status;
    if (typeof threshold === "number") data.threshold = threshold;
    const updated = await db.aIModel.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("AI model PATCH error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
