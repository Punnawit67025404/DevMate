// ==============================================================================
// lib/db/members.ts
// รายชื่อนิสิตอื่นในระบบ (profiles) — RLS ให้อ่านได้เฉพาะผู้ที่ล็อกอินแล้ว
// ถ้ายังไม่ล็อกอินจะได้รายการว่าง
// ==============================================================================

import { requireSupabase } from "../supabase";
import type { User } from "../../types";
import type { Profile as DbProfile } from "../types";
import { toUiUser } from "./mappers";

export async function fetchMembers(options: { limit?: number } = {}): Promise<User[]> {
  const sb = requireSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  let query = sb.from("profiles").select("*");
  if (user) query = query.neq("id", user.id);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // ไม่มี email ของคนอื่น (อยู่ใน auth.users ที่อ่านไม่ได้) จึงส่งสตริงว่าง
  return ((data ?? []) as DbProfile[]).map((row) => toUiUser(row, ""));
}
