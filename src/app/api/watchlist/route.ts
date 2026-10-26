import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const people = await db.watchlistPerson.findMany({
      where: {
        AND: [
          role && role !== "all" ? { roleEn: role } : {},
          status && status !== "all" ? { statusEn: status } : {},
        ],
      },
      orderBy: { matchCount: "desc" },
    });

    return NextResponse.json(people);
  } catch (error) {
    console.error("Watchlist error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, nameEn, role, roleEn, status, statusEn, notes } = body;

    if (!name || !role) {
      return NextResponse.json({ error: "name and role required" }, { status: 400 });
    }

    const person = await db.watchlistPerson.create({
      data: {
        name,
        nameEn: nameEn || name,
        role,
        roleEn: roleEn || role,
        status: status || "نشط",
        statusEn: statusEn || "Active",
        notes: notes || null,
        matchCount: 0,
      },
    });

    return NextResponse.json(person);
  } catch (error) {
    console.error("Create watchlist error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
