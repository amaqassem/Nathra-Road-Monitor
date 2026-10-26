import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const rules = await db.automationRule.findMany({ orderBy: { priority: "desc" } });
    return NextResponse.json(rules);
  } catch (error) {
    console.error("Automation rules error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, nameEn, description, conditions, actions, priority } = body;
    if (!name || !conditions || !actions) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const created = await db.automationRule.create({
      data: {
        name, nameEn: nameEn || name, description: description || "",
        conditions: typeof conditions === "string" ? conditions : JSON.stringify(conditions),
        actions: typeof actions === "string" ? actions : JSON.stringify(actions),
        priority: priority ?? 50, active: true,
      },
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error("Automation rule POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, active } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const updated = await db.automationRule.update({ where: { id }, data: { active: !!active } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Automation rule PATCH error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
