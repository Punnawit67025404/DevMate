// ==============================================================================
// lib/db/projects.ts
// อ่าน/เขียนโปรเจกต์ใน Supabase (ถ้ายังไม่ตั้งค่า .env.local จะ error — ไม่มีข้อมูลตัวอย่างสำรอง)
// ==============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabase } from "../supabase";
import type { Project as UiProject } from "../../types";
import type { Project as DbProject } from "../types";
import { toUiProject } from "./mappers";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type NewProjectInput = {
  title: string;
  description: string;
  category: string;
  duration: string;
  timeline: string;
  milestones: { title: string; dueDate: string }[];
  requiredSkills: string[];
  maxMembers: number;
};

// เติมชื่อเจ้าของ (profiles) และจำนวนสมาชิกที่อนุมัติแล้ว (view project_member_counts)
// ถ้า query เสริมล้มเหลว (เช่น ยังไม่ล็อกอิน) ใช้ค่าเริ่มต้นแทนการทำให้ทั้งหน้าพัง
async function toUiProjects(sb: SupabaseClient, rows: DbProject[]): Promise<UiProject[]> {
  if (rows.length === 0) return [];

  const ownerIds = [...new Set(rows.map((r) => r.owner_id))];
  const projectIds = rows.map((r) => r.id);

  const [profiles, counts] = await Promise.all([
    sb.from("profiles").select("id, display_name").in("id", ownerIds),
    sb.from("project_member_counts").select("project_id, approved_count").in("project_id", projectIds),
  ]);

  const names = new Map<string, string>(
    (profiles.data ?? []).map((p: { id: string; display_name: string }) => [p.id, p.display_name])
  );
  const approved = new Map<string, number>(
    (counts.data ?? []).map((c: { project_id: string; approved_count: number }) => [c.project_id, c.approved_count])
  );

  return rows.map((r) =>
    toUiProject(r, names.get(r.owner_id) || "ไม่ระบุชื่อ", approved.get(r.id) ?? 0)
  );
}

export async function fetchProjects(): Promise<UiProject[]> {
  const sb = requireSupabase();

  const { data, error } = await sb
    .from("projects")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return toUiProjects(sb, (data ?? []) as DbProject[]);
}

export async function fetchProject(id: string): Promise<UiProject | null> {
  const sb = requireSupabase();

  // id ที่ไม่ใช่ uuid ส่งเข้า query จะ error จึงถือว่าไม่พบโปรเจกต์
  if (!UUID_RE.test(id)) return null;

  const { data, error } = await sb.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const [project] = await toUiProjects(sb, [data as DbProject]);
  return project;
}

export async function createProject(input: NewProjectInput): Promise<{ id: string }> {
  const sb = requireSupabase();

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("กรุณาเข้าสู่ระบบก่อนสร้างโปรเจกต์");

  const { data, error } = await sb
    .from("projects")
    .insert({
      owner_id: user.id,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      duration: input.duration,
      timeline: input.timeline.trim(),
      milestones: input.milestones,
      tags: input.requiredSkills,
      max_members: input.maxMembers,
      status: "open",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id as string };
}

export type OwnedProject = { id: string; title: string; requiredSkills: string[] };

// โปรเจกต์ที่เราเป็นเจ้าของและยังเปิดรับ — ใช้เป็นตัวเลือก "ชวนเข้าโปรเจกต์ไหน" ในหน้า Matching
export async function fetchMyOwnedProjects(): Promise<OwnedProject[]> {
  const sb = requireSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return [];

  const { data, error } = await sb
    .from("projects")
    .select("id, title, tags")
    .eq("owner_id", user.id)
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((p: { id: string; title: string; tags: string[] | null }) => ({
    id: p.id,
    title: p.title,
    requiredSkills: p.tags ?? [],
  }));
}
