// ==============================================================================
// lib/db/auth.ts
// ตัวช่วยอ่านผู้ใช้ปัจจุบันจาก Supabase Auth (คืน null เมื่อยังไม่ตั้งค่า Supabase หรือยังไม่ล็อกอิน)
// ==============================================================================

import { getSupabase, requireSupabase } from "../supabase";
import { avatarUrlOf } from "./mappers";

export type CurrentUser = { id: string; email: string; displayName: string; avatarUrl?: string };

// ผู้ใช้ที่ล็อกอินอยู่ พร้อมชื่อที่แสดงจาก profiles (ใช้ใน Navbar)
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data } = await sb.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle();
  const fromMeta = user.user_metadata?.display_name;
  const displayName =
    data?.display_name ||
    (typeof fromMeta === "string" && fromMeta ? fromMeta : "") ||
    user.email?.split("@")[0] ||
    "ผู้ใช้";

  return { id: user.id, email: user.email ?? "", displayName, avatarUrl: avatarUrlOf(data?.avatar_url) };
}

// id ผู้ใช้ที่ล็อกอินอยู่ — ไม่ล็อกอินหรือยังไม่ตั้งค่า Supabase จะ throw (ใช้ในฟังก์ชันที่ต้องล็อกอิน)
export async function requireUserId(message = "กรุณาเข้าสู่ระบบก่อนใช้งาน"): Promise<string> {
  const sb = requireSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error(message);
  return user.id;
}

export async function getCurrentUserId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}
