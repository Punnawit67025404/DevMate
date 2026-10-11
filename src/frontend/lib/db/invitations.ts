// ==============================================================================
// lib/db/invitations.ts
// คำเชิญเข้าร่วมโปรเจกต์ (ตาราง invitations): เจ้าของโปรเจกต์ส่ง ผู้รับตอบรับ/ปฏิเสธ
// ==============================================================================

import { requireSupabase } from "../supabase";
import { requireUserId } from "./auth";
import { formatThaiDate } from "./mappers";
import type { TeamInvite } from "../../types";

type DbInvitation = {
  id: string;
  project_id: string;
  sender_id: string;
  recipient_id: string;
  status: string;
  role?: string;
  created_at: string;
};

const INVITE_STATUS: Record<string, TeamInvite["status"]> = {
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
};

// ผู้รับที่เราเชิญเข้าโปรเจกต์นี้ไปแล้ว (ใช้ปิดปุ่ม "ชวนเข้าทีม")
export async function fetchInvitedRecipientIds(projectId: string): Promise<string[]> {
  const sb = requireSupabase();
  const me = await requireUserId();

  const { data, error } = await sb
    .from("invitations")
    .select("recipient_id")
    .eq("project_id", projectId)
    .eq("sender_id", me);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: { recipient_id: string }) => row.recipient_id);
}

export async function sendInvitation(input: {
  projectId: string;
  recipientId: string;
  role: string;
}): Promise<void> {
  const sb = requireSupabase();
  const me = await requireUserId("กรุณาเข้าสู่ระบบก่อนส่งคำเชิญ");

  const { error } = await sb.from("invitations").insert({
    project_id: input.projectId,
    sender_id: me,
    recipient_id: input.recipientId,
    role: input.role.trim(),
    status: "pending",
  });

  if (error) {
    // 23505 = เชิญซ้ำ, 42501 = RLS ปฏิเสธ, P0001 = trigger ใน DB ("Only project owner can invite members")
    if (error.code === "23505") throw new Error("คุณเชิญสมาชิกคนนี้เข้าโปรเจกต์นี้ไปแล้ว");
    if (error.code === "42501" || error.code === "P0001") {
      throw new Error("ไม่สามารถส่งคำเชิญได้ (ต้องเป็นเจ้าของโปรเจกต์นี้)");
    }
    throw new Error(error.message);
  }
}

// คำเชิญที่ส่งมาหาเรา พร้อมชื่อโปรเจกต์และชื่อผู้เชิญ
export async function fetchMyInvites(): Promise<TeamInvite[]> {
  const sb = requireSupabase();
  const me = await requireUserId();

  const { data, error } = await sb
    .from("invitations")
    .select("*")
    .eq("recipient_id", me)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as DbInvitation[];
  if (rows.length === 0) return [];

  const projectIds = [...new Set(rows.map((r) => r.project_id))];
  const senderIds = [...new Set(rows.map((r) => r.sender_id))];

  const [projects, senders] = await Promise.all([
    sb.from("projects").select("id, title").in("id", projectIds),
    sb.from("profiles").select("id, display_name").in("id", senderIds),
  ]);

  const titles = new Map<string, string>(
    (projects.data ?? []).map((p: { id: string; title: string }) => [p.id, p.title])
  );
  const names = new Map<string, string>(
    (senders.data ?? []).map((p: { id: string; display_name: string }) => [p.id, p.display_name])
  );

  return rows.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    // อ่านชื่อโปรเจกต์ไม่ได้เมื่อโปรเจกต์ปิดรับแล้ว (RLS ให้เห็นเฉพาะโปรเจกต์ที่เปิดรับหรือของตัวเอง)
    projectTitle: titles.get(r.project_id) ?? "โปรเจกต์ที่ปิดรับแล้ว",
    senderName: names.get(r.sender_id) || "ไม่ระบุชื่อ",
    role: r.role?.trim() || "ไม่ระบุตำแหน่ง",
    date: formatThaiDate(r.created_at),
    status: INVITE_STATUS[r.status] ?? "pending",
  }));
}

// ตอบรับ/ปฏิเสธคำเชิญที่ยังรอตอบ (เฉพาะผู้รับ) — ตอบแล้วเปลี่ยนไม่ได้
export async function respondToInvite(id: string, status: "accepted" | "rejected"): Promise<void> {
  const sb = requireSupabase();
  const me = await requireUserId();

  const { data, error } = await sb
    .from("invitations")
    .update({ status })
    .eq("id", id)
    .eq("recipient_id", me)
    .eq("status", "pending")
    .select("id");

  if (error) throw new Error(error.message);
  // RLS/เงื่อนไขไม่ตรงจะไม่ error แต่ไม่มีแถวถูกแก้ไข
  if (!data || data.length === 0) throw new Error("ไม่สามารถตอบคำเชิญนี้ได้ (อาจตอบไปแล้ว)");
}
