// ==============================================================================
// lib/db/bookmarks.ts
// สมาชิกที่ผู้ใช้กดบันทึกไว้ในหน้า Matching (ตาราง bookmarks, RLS เห็นเฉพาะของตัวเอง)
// ==============================================================================

import { requireSupabase } from "../supabase";
import { requireUserId } from "./auth";

export async function fetchBookmarkIds(): Promise<string[]> {
  const sb = requireSupabase();
  const userId = await requireUserId();

  const { data, error } = await sb.from("bookmarks").select("member_id").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: { member_id: string }) => row.member_id);
}

export async function addBookmark(memberId: string): Promise<void> {
  const sb = requireSupabase();
  const userId = await requireUserId();

  const { error } = await sb.from("bookmarks").insert({ user_id: userId, member_id: memberId });
  // 23505 = บันทึกไว้อยู่แล้ว ถือว่าสำเร็จ
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function removeBookmark(memberId: string): Promise<void> {
  const sb = requireSupabase();
  const userId = await requireUserId();

  const { error } = await sb.from("bookmarks").delete().eq("user_id", userId).eq("member_id", memberId);
  if (error) throw new Error(error.message);
}
