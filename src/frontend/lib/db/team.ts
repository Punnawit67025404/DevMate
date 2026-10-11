// ==============================================================================
// lib/db/team.ts
// ทีมของฉัน: โปรเจกต์ที่เป็นสมาชิก, รายชื่อสมาชิก, ใบสมัครที่รอพิจารณา (เจ้าของ), ตำแหน่งที่ยังขาด
// สมาชิก = เจ้าของ + ผู้ที่ใบสมัครถูกอนุมัติ + ผู้ที่ตอบรับคำเชิญ
// ==============================================================================

import { requireSupabase } from "../supabase";
import { requireUserId } from "./auth";
import { initialsOf, toSkills, toUiApplication, UNNAMED } from "./mappers";
import type { Application as UiApplication } from "../../types";
import type { Application as DbApplication } from "../types";

export type TeamProject = {
  id: string;
  title: string;
  ownerId: string;
  maxMembers: number;
  requiredSkills: string[];
  status: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string; // ข้อความที่แสดง เช่น "เจ้าของโปรเจกต์", "สมาชิกทีม", หรือตำแหน่งจากคำเชิญ
  avatar: string;
  skills: string[];
  isOwner: boolean;
};

const ROLE_LABEL: Record<string, string> = {
  owner: "เจ้าของโปรเจกต์",
  member: "สมาชิกทีม",
};

// โปรเจกต์ที่ฉันเป็นสมาชิก (รวมโปรเจกต์ที่ปิดรับแล้ว) ใหม่สุดก่อน
export async function fetchMyTeams(): Promise<TeamProject[]> {
  const sb = requireSupabase();
  await requireUserId();

  const { data, error } = await sb.rpc("my_team_projects");
  if (error) throw new Error(error.message);

  return (data ?? []).map(
    (p: { id: string; title: string; owner_id: string; max_members: number; tags: string[] | null; status: string }) => ({
      id: p.id,
      title: p.title,
      ownerId: p.owner_id,
      maxMembers: p.max_members,
      requiredSkills: p.tags ?? [],
      status: p.status,
    })
  );
}

// สมาชิกของทีม (เฉพาะผู้ที่เป็นสมาชิกถึงจะเรียกดูได้) เจ้าของอยู่บนสุด
export async function fetchTeamMembers(projectId: string): Promise<TeamMember[]> {
  const sb = requireSupabase();

  const { data, error } = await sb.rpc("project_members", { pid: projectId });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as { user_id: string; role: string }[];
  if (rows.length === 0) return [];

  const { data: profiles, error: profileError } = await sb
    .from("profiles")
    .select("id, display_name, skills")
    .in("id", rows.map((r) => r.user_id));
  if (profileError) throw new Error(profileError.message);

  const byId = new Map<string, { display_name: string; skills: unknown }>(
    (profiles ?? []).map((p: { id: string; display_name: string; skills: unknown }) => [p.id, p])
  );

  return rows
    .map((r) => {
      const profile = byId.get(r.user_id);
      const name = profile?.display_name || UNNAMED;
      return {
        id: r.user_id,
        name,
        role: ROLE_LABEL[r.role] ?? r.role,
        avatar: initialsOf(name),
        skills: toSkills(profile?.skills).map((s) => s.name),
        isOwner: r.role === "owner",
      };
    })
    .sort((a, b) => Number(b.isOwner) - Number(a.isOwner));
}

// ตำแหน่งที่ยังขาด = ทักษะที่โปรเจกต์ต้องการแต่ยังไม่มีสมาชิกคนไหนมี + จำนวนที่นั่งว่าง
export function computeOpenRoles(team: TeamProject, members: TeamMember[]) {
  const covered = new Set(members.flatMap((m) => m.skills));
  return {
    missingSkills: team.requiredSkills.filter((s) => !covered.has(s)),
    openSeats: Math.max(team.maxMembers - members.length, 0),
  };
}

// ใบสมัครที่รอพิจารณาของโปรเจกต์ (เจ้าของเท่านั้นที่อ่านใบสมัครของคนอื่นได้)
export async function fetchPendingApplications(projectId: string): Promise<UiApplication[]> {
  const sb = requireSupabase();

  const { data, error } = await sb
    .from("applications")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as DbApplication[];
  if (rows.length === 0) return [];

  const { data: profiles } = await sb
    .from("profiles")
    .select("id, display_name")
    .in("id", [...new Set(rows.map((r) => r.applicant_id))]);
  const names = new Map<string, string>(
    (profiles ?? []).map((p: { id: string; display_name: string }) => [p.id, p.display_name])
  );

  return rows.map((r) => toUiApplication(r, names.get(r.applicant_id) || UNNAMED));
}

// อนุมัติ/ปฏิเสธใบสมัครที่ยังรอพิจารณา (เจ้าของเท่านั้น)
export async function reviewApplication(applicationId: string, decision: "approved" | "rejected"): Promise<void> {
  const sb = requireSupabase();

  const { data, error } = await sb
    .from("applications")
    .update({ status: decision })
    .eq("id", applicationId)
    .eq("status", "pending")
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("ไม่สามารถพิจารณาใบสมัครนี้ได้ (อาจถูกพิจารณาไปแล้ว หรือคุณไม่ใช่เจ้าของ)");
}
