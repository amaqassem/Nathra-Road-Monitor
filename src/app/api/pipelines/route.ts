import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const pipelines = await db.pipeline.findMany({ orderBy: { active: "desc" } });
    return NextResponse.json(pipelines);
  } catch (error) {
    console.error("Pipelines error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, active } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const pipeline = await db.pipeline.update({
      where: { id },
      data: { active: !!active },
    });
    return NextResponse.json(pipeline);
  } catch (error) {
    console.error("Toggle pipeline error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
