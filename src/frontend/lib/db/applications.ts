// ==============================================================================
// lib/db/applications.ts
// ใบสมัครเข้าร่วมโปรเจกต์ (ถ้ายังไม่ตั้งค่า .env.local จะ error — ไม่มีโหมดจำลอง)
// ==============================================================================

import { requireSupabase } from "../supabase";
import type { Application as UiApplication } from "../../types";
import type { Application as DbApplication } from "../types";
import { toUiApplication } from "./mappers";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ApplyInput = {
  projectId: string;
  message: string;
  portfolioLink: string;
};

function displayNameOf(user: { email?: string; user_metadata?: Record<string, unknown> }): string {
  const fromMeta = user.user_metadata?.display_name;
  if (typeof fromMeta === "string" && fromMeta) return fromMeta;
  return user.email?.split("@")[0] ?? "ผู้ใช้";
}

// ใบสมัครของผู้ใช้ที่ล็อกอินอยู่ต่อโปรเจกต์นี้ (ไม่มี/ยังไม่ล็อกอิน = null)
export async function fetchMyApplication(projectId: string): Promise<UiApplication | null> {
  const sb = requireSupabase();
  if (!UUID_RE.test(projectId)) return null;

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data, error } = await sb
    .from("applications")
    .select("*")
    .eq("project_id", projectId)
    .eq("applicant_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toUiApplication(data as DbApplication, displayNameOf(user)) : null;
}

export async function applyToProject(input: ApplyInput): Promise<UiApplication> {
  const sb = requireSupabase();

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("กรุณาเข้าสู่ระบบก่อนสมัครเข้าร่วมโปรเจกต์");

  const { data, error } = await sb
    .from("applications")
    .insert({
      project_id: input.projectId,
      applicant_id: user.id,
      message: input.message.trim(),
      portfolio_link: input.portfolioLink.trim(),
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    // 23505 = unique_violation (สมัครซ้ำ), 42501 = RLS ปฏิเสธ (โปรเจกต์ปิดรับ หรือเป็นเจ้าของเอง)
    if (error.code === "23505") throw new Error("คุณสมัครโปรเจกต์นี้ไปแล้ว");
    if (error.code === "42501") {
      throw new Error("ไม่สามารถสมัครโปรเจกต์นี้ได้ (โปรเจกต์อาจปิดรับสมัคร หรือคุณเป็นเจ้าของโปรเจกต์)");
    }
    throw new Error(error.message);
  }

  return toUiApplication(data as DbApplication, displayNameOf(user));
}
