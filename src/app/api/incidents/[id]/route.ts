import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit, createNotification } from "@/lib/incidents";

const VALID_TRANSITIONS: Record<string, string[]> = {
  detected: ["under_review", "confirmed", "closed"],
  under_review: ["confirmed", "closed"],
  confirmed: ["assigned", "closed"],
  assigned: ["in_progress", "closed"],
  in_progress: ["resolved", "closed"],
  resolved: ["closed"],
  closed: [],
};

const STATUS_LABEL_AR: Record<string, string> = {
  detected: "مكتشف",
  under_review: "قيد المراجعة",
  confirmed: "مؤكد",
  assigned: "معيّن",
  in_progress: "قيد المعالجة",
  resolved: "تم الحل",
  closed: "مغلق",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const incident = await db.incident.findUnique({
      where: { id },
      include: {
        camera: { include: { site: true } },
        site: true,
        authority: true,
        evidence: { orderBy: { capturedAt: "desc" } },
        auditLogs: { orderBy: { timestamp: "desc" } },
        notifications: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!incident) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(incident);
  } catch (error) {
    console.error("Incident GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// تغيير الحالة / تعيين مسؤول / تأكيد
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body as { action: "change_status" | "assign" | "confirm" | "route"; status?: string; operator?: string; authorityId?: string; actor?: string };

    const incident = await db.incident.findUnique({ where: { id } });
    if (!incident) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const actor = body.actor || "operator";

    if (action === "change_status" && body.status) {
      const allowed = VALID_TRANSITIONS[incident.status] || [];
      if (!allowed.includes(body.status) && incident.status !== body.status) {
        return NextResponse.json({ error: `Invalid transition from ${incident.status} to ${body.status}` }, { status: 400 });
      }
      const updates: any = { status: body.status };
      if (body.status === "resolved") updates.resolvedAt = new Date();
      if (body.status === "closed") updates.closedAt = new Date();

      const updated = await db.incident.update({ where: { id }, data: updates });

      await logAudit({
        incidentId: id,
        action: "status_changed",
        actor,
        details: JSON.stringify({ from: incident.status, to: body.status, fromLabel: STATUS_LABEL_AR[incident.status], toLabel: STATUS_LABEL_AR[body.status] }),
      });

      await createNotification({
        incidentId: id,
        type: "status_change",
        title: `تحديث الحادث ${incident.incidentNo}`,
        message: `الحالة: ${STATUS_LABEL_AR[body.status]}`,
        recipient: "operators",
      });

      return NextResponse.json(updated);
    }

    if (action === "assign" && body.operator) {
      const updated = await db.incident.update({
        where: { id },
        data: { assignedOperator: body.operator, status: incident.status === "confirmed" ? "assigned" : incident.status },
      });
      await logAudit({
        incidentId: id,
        action: "operator_assigned",
        actor,
        details: JSON.stringify({ operator: body.operator }),
      });
      await createNotification({
        incidentId: id,
        type: "assigned",
        title: `تعيين حادث ${incident.incidentNo}`,
        message: `تم تعيين الحادث لـ ${body.operator}`,
        recipient: body.operator,
      });
      return NextResponse.json(updated);
    }

    if (action === "confirm") {
      const updated = await db.incident.update({ where: { id }, data: { status: "confirmed" } });
      await logAudit({ incidentId: id, action: "incident_confirmed", actor, details: "{}" });
      return NextResponse.json(updated);
    }

    if (action === "route" && body.authorityId) {
      const auth = await db.authority.findUnique({ where: { id: body.authorityId } });
      if (!auth) return NextResponse.json({ error: "Authority not found" }, { status: 404 });
      const updated = await db.incident.update({ where: { id }, data: { authorityId: body.authorityId } });
      await logAudit({
        incidentId: id,
        action: "authority_routed",
        actor,
        details: JSON.stringify({ authority: auth.nameEn, sandboxMode: auth.sandboxMode, manual: true }),
      });
      await createNotification({
        incidentId: id,
        type: "route",
        title: `تحويل الحادث ${incident.incidentNo}`,
        message: `حُوّل إلى ${auth.name} ${auth.sandboxMode ? "(وضع اختبار)" : ""}`,
        recipient: "operators",
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Incident PATCH error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
