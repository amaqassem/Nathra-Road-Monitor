#!/usr/bin/env bun
/**
 * سكريبت تهيئة قاعدة البيانات للإنتاج
 * آمن: لا يعرض endpoint مفتوح، يُشغّل من سطر الأوامر فقط
 *
 * الاستخدام:
 *   bun run scripts/seed.ts                    # تهيئة إذا كانت فارغة
 *   bun run scripts/seed.ts --force            # إعادة تهيئة كاملة (يمسح القديم)
 */
import { seedDatabase } from "../src/lib/seed";

const force = process.argv.includes("--force");

async function main() {
  console.log("🌱 Nathra Database Seeding");
  console.log("─────────────────────────────");

  if (force) {
    console.log("⚠️  Force mode: this will re-seed (existing data may conflict)");
  }

  try {
    const result = await seedDatabase();
    if (result.seeded) {
      console.log("✓ Seeding complete!");
      console.log(`  Sites: ${result.sites}`);
      console.log(`  Cameras: ${result.cameras}`);
      console.log(`  Authorities: ${result.authorities}`);
    } else {
      console.log("ℹ️  Database already has data. Use --force to re-seed.");
      console.log(`  Message: ${result.message}`);
    }
    process.exit(0);
  } catch (error) {
    console.error("✗ Seeding failed:", error);
    process.exit(1);
  }
}

main();
