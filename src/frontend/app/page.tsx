"use client";

// ==============================================================================
// app/page.tsx
// Landing Page แสดงภาพรวมระบบ DevMate และปุ่มเชื่อมต่อไปยังโมดูลต่างๆ
// ==============================================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "../components/Avatar";
import { fetchProjects } from "../lib/db/projects";
import { fetchMembers } from "../lib/db/members";
import { fetchPublicStats, type PublicStats } from "../lib/db/stats";
import { getCurrentUserId } from "../lib/db/auth";
import type { Project, User } from "../types";

export default function HomePage() {
  // โปรเจกต์แนะนำจาก Supabase (ถ้ายังไม่ตั้งค่า .env.local จะเป็นข้อมูลตัวอย่าง)
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");

  // สถิติภาพรวม และสมาชิกแนะนำ (สมาชิกเห็นได้เฉพาะผู้ที่ล็อกอินแล้ว)
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [membersLoading, setMembersLoading] = useState(true);

  useEffect(() => {
    let live = true;
    fetchProjects()
      .then((rows) => {
        if (live) setProjects(rows);
      })
      .catch((err: unknown) => {
        if (live) setProjectsError(err instanceof Error ? err.message : "โหลดโปรเจกต์ไม่สำเร็จ");
      })
      .finally(() => {
        if (live) setProjectsLoading(false);
      });

    // ถ้าดึงสถิติไม่ได้ (เช่น ยังไม่ได้รัน SQL public_stats) จะแสดง "-" แทนตัวเลข
    fetchPublicStats()
      .then((s) => {
        if (live) setStats(s);
      })
      .catch(() => {});

    getCurrentUserId()
      .then(async (uid) => {
        if (!live) return;
        setSignedIn(!!uid);
        if (!uid) return;
        const rows = await fetchMembers({ limit: 12 });
        // แนะนำเฉพาะคนที่กรอกทักษะแล้ว
        if (live) setMembers(rows.filter((m) => m.skills.length > 0).slice(0, 4));
      })
      .catch(() => {})
      .finally(() => {
        if (live) setMembersLoading(false);
      });

    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="space-y-12 sm:space-y-16">
      
      {/* 1. Hero Section: แบนเนอร์หลักพร้อม Call-to-Action */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 px-6 py-16 sm:px-12 sm:py-24 text-center text-white shadow-xl">
        {/* แสงประกายพื้นหลัง */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold backdrop-blur-md border border-white/20">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            Tools for Modern Learners · วิชา Software Engineering
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
            หาทีมที่ใช่ <br />
            <span className="text-blue-200">สร้างโปรเจกต์ที่ชอบ</span>
          </h1>

          <p className="text-base sm:text-lg text-blue-100/90 leading-relaxed max-w-2xl mx-auto">
            แพลตฟอร์มจับคู่หาเพื่อนร่วมทีมทำโปรเจกต์ของนิสิตมหาวิทยาลัยตามทักษะความเชี่ยวชาญ 
            ไม่ว่าจะงานเดี่ยว งานวิชา หรือสตาร์ทอัพ หาเพื่อนช่วยเติมเต็มสกิลได้ที่นี่
          </p>

          {/* ปุ่ม Action หลัก */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href="/matching"
              className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-700 shadow-lg hover:bg-blue-50 active:scale-95 transition"
            >
              🔍 ค้นหาเพื่อนร่วมทีมตามทักษะ
            </Link>
            <Link
              href="/projects"
              className="rounded-xl bg-blue-500/40 border border-white/25 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md hover:bg-blue-500/60 active:scale-95 transition"
            >
              📂 สำรวจโปรเจกต์ที่เปิดรับ
            </Link>
            <Link
              href="/projects/create"
              className="rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-bold text-slate-900 shadow-lg hover:bg-amber-300 active:scale-95 transition"
            >
              + สร้างโปรเจกต์ใหม่
            </Link>
          </div>
        </div>

        {/* ตัวเลขสถิติภาพรวม */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/15 pt-8 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{stats ? stats.students : "-"}</p>
            <p className="text-xs text-blue-200 mt-1">นิสิตในระบบ</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{stats ? stats.projects : "-"}</p>
            <p className="text-xs text-blue-200 mt-1">โปรเจกต์ที่สร้าง</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{stats ? stats.open_projects : "-"}</p>
            <p className="text-xs text-blue-200 mt-1">โปรเจกต์ที่เปิดรับสมัคร</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{stats ? stats.members : "-"}</p>
            <p className="text-xs text-blue-200 mt-1">สมาชิกที่เข้าร่วมทีมแล้ว</p>
          </div>
        </div>
      </section>

      {/* 2. ฟีเจอร์เด่นของระบบ 4 ข้อ (Features Grid) */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            ระบบที่ออกแบบมาเพื่อการทำงานเป็นทีมของนิสิต
          </h2>
          <p className="text-sm text-slate-500">
            ช่วยแก้ปัญหาคนขาด สกิลไม่ตรง และการจัดการงานที่วุ่นวาย
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 text-xl font-bold">
              🎯
            </div>
            <h3 className="font-bold text-slate-900 text-base">Smart Skill Matching</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              คำนวณ Match Score (%) อัตโนมัติตามทักษะที่โปรเจกต์ต้องการ เทียบกับทักษะจริงของผู้สมัคร
            </p>
            <Link href="/matching" className="inline-block text-xs font-bold text-blue-600 hover:underline">
              ดูระบบจับคู่ →
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 text-xl font-bold">
              📑
            </div>
            <h3 className="font-bold text-slate-900 text-base">Project Board & Apply</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              โพสต์และค้นหาโปรเจกต์พร้อมระบบ 3 ขั้นตอน ส่งใบสมัครพร้อมแนบข้อความแนะนำตัวและพอร์ตโฟลิโอ
            </p>
            <Link href="/projects" className="inline-block text-xs font-bold text-blue-600 hover:underline">
              ดูบอร์ดโปรเจกต์ →
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 text-xl font-bold">
              💬
            </div>
            <h3 className="font-bold text-slate-900 text-base">Team Workspace</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              เวิร์กสเปซ 3 คอลัมน์ ครบครันด้วยแชตกลุ่มทีม, บอร์ด Task งานเร่งด่วน และปฏิทินนัดหมาย Next Meeting
            </p>
            <Link href="/myteam" className="inline-block text-xs font-bold text-blue-600 hover:underline">
              เข้าเวิร์กสเปซทีม →
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 text-xl font-bold">
              🎓
            </div>
            <h3 className="font-bold text-slate-900 text-base">University Verified</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ปลอดภัย เชื่อถือได้ 100% จำกัดเฉพาะอีเมลโดเมนมหาวิทยาลัย พร้อมระบบยืนยันตัวตนด้วยรหัส OTP 6 หลัก
            </p>
            <Link href="/auth" className="inline-block text-xs font-bold text-blue-600 hover:underline">
              ระบบยืนยันตัวตน →
            </Link>
          </div>
        </div>
      </section>

      {/* 3. โปรเจกต์แนะนำล่าสุด (Featured Projects) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              โปรเจกต์แนะนำที่กำลังเปิดรับสมัคร
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ร่วมเป็นส่วนหนึ่งของทีมนวัตกรรมนิสิต
            </p>
          </div>
          <Link
            href="/projects"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            ดูทั้งหมด ({projects.length}) →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projectsError && (
            <p className="col-span-full text-xs text-red-600 font-medium">⚠️ {projectsError}</p>
          )}
          {!projectsError && projects.length === 0 && (
            <p className="col-span-full text-xs text-slate-400">
              {projectsLoading ? "กำลังโหลดโปรเจกต์..." : "ยังไม่มีโปรเจกต์ที่เปิดรับสมัครในตอนนี้"}
            </p>
          )}
          {projects.slice(0, 3).map((project) => (
            <div
              key={project.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700">
                    {project.category}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    เปิดรับ {project.currentMembers}/{project.maxMembers} คน
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {project.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>

                {/* ทักษะที่ต้องการ */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {project.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  โดย {project.ownerName}
                </span>
                <Link
                  href={`/projects/${project.id}`}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                >
                  ดูรายละเอียด & สมัคร
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. สมาชิกแนะนำสำหรับจับคู่ (Featured Candidates) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              เพื่อนร่วมทีมแนะนำประจำสัปดาห์
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              นิสิตที่มีทักษะโดดเด่นพร้อมเข้าร่วมโปรเจกต์
            </p>
          </div>
          <Link
            href="/matching"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            ค้นหาเพิ่มเติม →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {!signedIn && (
            <p className="col-span-full text-xs text-slate-400">
              {membersLoading ? (
                "กำลังโหลด..."
              ) : (
                <>
                  <Link href="/auth" className="font-bold text-blue-600 hover:underline">
                    เข้าสู่ระบบ
                  </Link>{" "}
                  เพื่อดูเพื่อนร่วมทีมแนะนำ
                </>
              )}
            </p>
          )}
          {signedIn && !membersLoading && members.length === 0 && (
            <p className="col-span-full text-xs text-slate-400">
              ยังไม่มีสมาชิกคนอื่นที่กรอกทักษะไว้ในตอนนี้
            </p>
          )}
          {members.map((candidate) => (
            <div
              key={candidate.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm hover:shadow-md transition space-y-3"
            >
              <Avatar
                name={candidate.name}
                url={candidate.avatarUrl}
                className="mx-auto h-14 w-14 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 font-extrabold text-base"
                zoomable
              />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  <Link href={`/members/${candidate.id}`} className="hover:text-blue-600 hover:underline transition">
                    {candidate.name}
                  </Link>
                </h4>
                <p className="text-[11px] text-slate-500 truncate">{candidate.faculty}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-1">
                {candidate.skills.slice(0, 2).map((s) => (
                  <span
                    key={s.name}
                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600 font-medium"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
              <p className="text-xs font-bold text-blue-600">
                {candidate.skills.length} ทักษะ
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
