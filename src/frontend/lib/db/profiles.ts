// ==============================================================================
// lib/db/profiles.ts
// โปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่ (profiles + ลิงก์ผลงานจาก portfolio_items)
// ==============================================================================

import { requireSupabase } from "../supabase";
import type { User, Skill } from "../../types";
import type { Profile as DbProfile } from "../types";
import { toUiUser } from "./mappers";

// ชื่อใน portfolio_items.title ที่ใช้เก็บลิงก์ GitHub / Behance
export const PORTFOLIO_GITHUB = "GitHub";
export const PORTFOLIO_BEHANCE = "Behance";

function linksOf(items: { title: string; url: string }[]) {
  return {
    githubUrl: items.find((i) => i.title === PORTFOLIO_GITHUB)?.url,
    behanceUrl: items.find((i) => i.title === PORTFOLIO_BEHANCE)?.url,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// โปรไฟล์ของสมาชิกคนอื่น (ผู้ล็อกอินอ่านได้ตาม RLS) ไม่พบ/id ไม่ถูกต้อง = null
// ไม่คืนอีเมล (อยู่ใน auth.users ที่อ่านไม่ได้) และไม่ใช้คอลัมน์ portfolio_url ที่ไม่มีตัวตรวจรูปแบบ
export async function fetchMemberProfile(id: string): Promise<User | null> {
  if (!UUID_RE.test(id)) return null;
  const sb = requireSupabase();

  const [profileRes, portfolioRes] = await Promise.all([
    sb.from("profiles").select("*").eq("id", id).maybeSingle(),
    sb.from("portfolio_items").select("title, url").eq("user_id", id),
  ]);
  if (profileRes.error) throw new Error(profileRes.error.message);
  if (!profileRes.data) return null;

  return toUiUser(
    profileRes.data as DbProfile,
    "",
    linksOf((portfolioRes.data ?? []) as { title: string; url: string }[])
  );
}

// คืน null ถ้ายังไม่ล็อกอิน
export async function fetchMyProfile(): Promise<User | null> {
  const sb = requireSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const [profileRes, portfolioRes] = await Promise.all([
    sb.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    sb.from("portfolio_items").select("title, url").eq("user_id", user.id),
  ]);
  if (profileRes.error) throw new Error(profileRes.error.message);

  const links = linksOf((portfolioRes.data ?? []) as { title: string; url: string }[]);

  // บัญชีที่ยังไม่มีแถว profiles: สร้างค่าว่างจากข้อมูล auth เพื่อให้หน้าใช้งานต่อได้
  const profile: DbProfile = (profileRes.data as DbProfile | null) ?? {
    id: user.id,
    display_name: (user.user_metadata?.display_name as string | undefined) ?? user.email?.split("@")[0] ?? "",
    bio: "",
    faculty: "",
    year: 1,
    skills: [],
    availability: "",
    portfolio_url: "",
  };

  return toUiUser(profile, user.email ?? "", links);
}

async function requireUserId(): Promise<string> {
  const sb = requireSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("กรุณาเข้าสู่ระบบก่อนบันทึกโปรไฟล์");
  return user.id;
}

// upsert เฉพาะคอลัมน์ที่ส่งไป (คอลัมน์อื่นของแถวเดิมไม่ถูกแตะ) — ใช้ได้ทั้งบัญชีที่มี/ยังไม่มีแถว profiles
async function upsertProfile(values: Record<string, unknown>): Promise<void> {
  const sb = requireSupabase();
  const id = await requireUserId();
  const { error } = await sb.from("profiles").upsert({ id, ...values }, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

export async function saveProfile(input: {
  displayName: string;
  faculty: string;
  year: number;
  bio: string;
}): Promise<void> {
  const displayName = input.displayName.trim();
  if (!displayName) throw new Error("กรุณาระบุชื่อที่แสดง");

  await upsertProfile({
    display_name: displayName,
    faculty: input.faculty.trim(),
    year: input.year,
    bio: input.bio.trim(),
  });
}

// เก็บเฉพาะ name + level (id ใน UI สร้างจากชื่อตอนอ่าน)
export async function saveSkills(skills: Skill[]): Promise<void> {
  await upsertProfile({ skills: skills.map(({ name, level }) => ({ name, level })) });
}

// ลิงก์ผลงาน: ไม่มี unique(user_id, title) จึงลบของเดิมแล้วเพิ่มใหม่ (ค่าว่าง = ลบลิงก์นั้นทิ้ง)
export async function savePortfolioLinks(links: { githubUrl: string; behanceUrl: string }): Promise<void> {
  const sb = requireSupabase();
  const userId = await requireUserId();

  const entries: [string, string][] = [
    [PORTFOLIO_GITHUB, links.githubUrl.trim()],
    [PORTFOLIO_BEHANCE, links.behanceUrl.trim()],
  ];

  for (const [title, url] of entries) {
    const del = await sb.from("portfolio_items").delete().eq("user_id", userId).eq("title", title);
    if (del.error) throw new Error(del.error.message);

    if (url) {
      const ins = await sb.from("portfolio_items").insert({ user_id: userId, title, url });
      if (ins.error) {
        throw new Error(
          ins.error.code === "23514" ? "ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://" : ins.error.message
        );
      }
    }
  }
}
