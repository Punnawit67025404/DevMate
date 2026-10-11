// ==============================================================================
// lib/db/stats.ts
// สถิติภาพรวมของแพลตฟอร์มสำหรับหน้าแรก (ผ่าน SQL function public_stats เปิดให้คนทั่วไปอ่านได้)
// ==============================================================================

import { requireSupabase } from "../supabase";

export type PublicStats = {
  students: number;
  projects: number;
  open_projects: number;
  members: number;
};

export async function fetchPublicStats(): Promise<PublicStats> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("public_stats");
  if (error) throw new Error(error.message);
  return data as PublicStats;
}
