import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "فشل في تهيئة البيانات" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await seedDatabase();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "فشل في تهيئة البيانات" },
      { status: 500 }
    );
  }
}
