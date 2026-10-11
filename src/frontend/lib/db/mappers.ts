// ==============================================================================
// lib/db/mappers.ts
// แปลงแถวจากฐานข้อมูล (snake_case, lib/types.ts) เป็นชนิดข้อมูลที่หน้า UI ใช้ (types/index.ts)
// ==============================================================================

import type { Project as UiProject, Application as UiApplication, User, Skill } from "../../types";
import type {
  Project as DbProject,
  Application as DbApplication,
  Profile as DbProfile,
} from "../types";

// ชื่อที่แสดงเมื่อโปรไฟล์ยังไม่ได้ตั้งชื่อ
export const UNNAMED = "ไม่ระบุชื่อ";

// bucket รูปโปรไฟล์ใน Supabase Storage
export const AVATAR_BUCKET = "avatars";

// profiles.avatar_url เก็บ path ใน bucket (เช่น "<user_id>/avatar-123.jpg") -> URL สาธารณะ
// ว่าง/ไม่มีค่า = ไม่มีรูป (แสดงตัวย่อชื่อแทน)
export function avatarUrlOf(path: string | null | undefined): string | undefined {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !base) return undefined;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`;
}

// ตัวย่อชื่อสำหรับวงกลมอวาตาร์: ชื่อมีหลายคำใช้ตัวแรกของ 2 คำแรก ไม่งั้นใช้ 2 ตัวแรก
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// profiles.skills เป็น jsonb [{name, level}] (ไม่มี id) — สร้าง id จากชื่อให้ UI ใช้เป็น key
export function toSkills(raw: unknown): Skill[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is { name: string; level?: number } => !!s && typeof s.name === "string")
    .map((s) => ({ id: s.name.toLowerCase(), name: s.name, level: Number(s.level) || 20 }));
}

export function toUiUser(
  row: DbProfile,
  email: string,
  links: { githubUrl?: string; behanceUrl?: string } = {}
): User {
  return {
    id: row.id,
    name: row.display_name || UNNAMED,
    email,
    faculty: row.faculty,
    year: row.year,
    bio: row.bio,
    avatar: initialsOf(row.display_name),
    avatarUrl: avatarUrlOf(row.avatar_url),
    skills: toSkills(row.skills),
    githubUrl: links.githubUrl ?? "",
    behanceUrl: links.behanceUrl ?? "",
  };
}

// สถานะใบสมัครใน DB ใช้ "approved" แต่ UI ใช้ "accepted"
const APPLICATION_STATUS: Record<string, UiApplication["status"]> = {
  pending: "pending",
  approved: "accepted",
  rejected: "rejected",
};

export function toUiProject(row: DbProject, ownerName: string, approvedCount: number): UiProject {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    category: row.category,
    duration: row.duration,
    timeline: row.timeline ?? "",
    requiredSkills: row.tags ?? [],
    maxMembers: row.max_members,
    // เจ้าของโปรเจกต์นับเป็นสมาชิกคนแรก
    currentMembers: 1 + approvedCount,
    // DB มี open/draft/hidden แต่ UI รู้จักแค่เปิด/ปิดรับ
    status: row.status === "open" ? "open" : "closed",
    milestones: row.milestones ?? [],
    techStack: row.tech_stack ?? [],
    ownerName,
    createdAt: row.created_at.slice(0, 10),
  };
}

export function formatThaiDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export function toUiApplication(row: DbApplication, applicantName: string): UiApplication {
  return {
    id: row.id,
    projectId: row.project_id,
    applicantId: row.applicant_id,
    applicantName,
    message: row.message,
    portfolioLink: row.portfolio_link ?? "",
    status: APPLICATION_STATUS[row.status] ?? "pending",
    appliedAt: formatThaiDate(row.created_at),
  };
}
