import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const notifications = await db.notification.findMany({
      where: unreadOnly ? { read: false } : {},
      include: { incident: { select: { incidentNo: true, type: true, typeEn: true, severity: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unread = await db.notification.count({ where: { read: false } });
    return NextResponse.json({ notifications, unread });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// تعليم كمقروء
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, read, markAllRead } = body;
    if (markAllRead) {
      await db.notification.updateMany({ where: { read: false }, data: { read: true } });
      return NextResponse.json({ success: true, markedAll: true });
    }
    if (id) {
      const updated = await db.notification.update({ where: { id }, data: { read: read ?? true } });
      return NextResponse.json(updated);
    }
    return NextResponse.json({ error: "id or markAllRead required" }, { status: 400 });
  } catch (error) {
    console.error("Notification PATCH error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
