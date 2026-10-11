// ==============================================================================
// lib/db/events.ts
// นัดหมายของทีม (ตาราง team_events) — แสดงนัดหมายครั้งถัดไปในหน้า My Team
// ==============================================================================

import { requireSupabase } from "../supabase";

export type TeamEvent = {
  id: string;
  title: string;
  startsAt: string; // ISO
  endsAt: string | null;
  platform: string;
  link: string;
};

type DbEvent = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  platform?: string;
  link?: string;
};

const URL_RE = /^https?:\/\/\S+$/i;

// นัดหมายที่ใกล้ที่สุดซึ่งยังไม่ผ่านไป (ไม่มี = null)
export async function fetchNextEvent(projectId: string): Promise<TeamEvent | null> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("team_events")
    .select("*")
    .eq("project_id", projectId)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1);
  if (error) throw new Error(error.message);

  const row = (data ?? [])[0] as DbEvent | undefined;
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    platform: row.platform ?? "",
    link: row.link ?? "",
  };
}

export async function createEvent(input: {
  projectId: string;
  title: string;
  startsAt: string; // ISO
  endsAt: string | null; // ISO
  platform: string;
  link: string;
}): Promise<void> {
  const sb = requireSupabase();
  const title = input.title.trim();
  const link = input.link.trim();

  if (!title) throw new Error("กรุณาระบุหัวข้อการประชุม");
  if (Number.isNaN(Date.parse(input.startsAt))) throw new Error("กรุณาเลือกวันและเวลาเริ่ม");
  if (new Date(input.startsAt).getTime() < Date.now()) throw new Error("เวลาเริ่มต้องเป็นเวลาในอนาคต");
  if (input.endsAt && Date.parse(input.endsAt) <= Date.parse(input.startsAt)) {
    throw new Error("เวลาสิ้นสุดต้องหลังเวลาเริ่ม");
  }
  if (link && !URL_RE.test(link)) throw new Error("ลิงก์ประชุมต้องขึ้นต้นด้วย http:// หรือ https://");

  const { error } = await sb.from("team_events").insert({
    project_id: input.projectId,
    title,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    platform: input.platform.trim(),
    link,
  });
  if (error) throw new Error(error.message);
}
