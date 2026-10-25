import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const rules = await db.routingRule.findMany({
      include: { authority: true },
      orderBy: { priority: "desc" },
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error("Routing rules error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, nameEn, conditionType, conditionValue, authorityId, priority } = body;
    if (!name || !conditionType || !conditionValue || !authorityId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const created = await db.routingRule.create({
      data: { name, nameEn: nameEn || name, conditionType, conditionValue, authorityId, priority: priority ?? 50, active: true },
      include: { authority: true },
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error("Routing rule POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, active } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const updated = await db.routingRule.update({ where: { id }, data: { active: !!active } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Routing rule PATCH error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
