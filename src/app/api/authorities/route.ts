import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const authorities = await db.authority.findMany({
      include: {
        routingRules: true,
        _count: { select: { incidents: true } },
      },
      orderBy: { categoryEn: "asc" },
    });
    return NextResponse.json(authorities);
  } catch (error) {
    console.error("Authorities error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, nameEn, category, categoryEn, contactName, contactPhone, contactEmail, webhookUrl, sandboxMode } = body;
    if (!name || !nameEn) return NextResponse.json({ error: "name required" }, { status: 400 });
    const created = await db.authority.create({
      data: { name, nameEn, category: category || "داخلي", categoryEn: categoryEn || "internal", contactName, contactPhone, contactEmail, webhookUrl, sandboxMode: sandboxMode ?? true, active: true },
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error("Authority POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
