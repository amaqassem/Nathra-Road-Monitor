import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

/**
 * تهيئة قاعدة البيانات
 *
 * في التطوير: يعمل بدون قيود
 * في الإنتاج: يتطلب header `x-admin-key` يساوي `ADMIN_SEED_KEY` من البيئة
 *             أو `ALLOW_PUBLIC_SEED=true` (غير موصى به)
 */
function isAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.ALLOW_PUBLIC_SEED === "true") return true;
  const adminKey = process.env.ADMIN_SEED_KEY;
  if (!adminKey) return false;
  const provided = request.headers.get("x-admin-key");
  return provided === adminKey;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Set ADMIN_SEED_KEY env and provide x-admin-key header, or run scripts/seed.ts on the server." },
      { status: 403 }
    );
  }
  try {
    const result = await seedDatabase();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const result = await seedDatabase();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
