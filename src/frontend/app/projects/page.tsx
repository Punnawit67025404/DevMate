"use client";

// ==============================================================================
// app/projects/page.tsx
// หน้ารวมโปรเจกต์ทั้งหมด (US-05: ค้นหาและคัดกรองโปรเจกต์ตามทักษะของผู้ใช้)
// ==============================================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProjects } from "../../lib/db/projects";
import { fetchMyProfile } from "../../lib/db/profiles";
import type { Project } from "../../types";

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterByUserSkills, setFilterByUserSkills] = useState(false);

  // รายการโปรเจกต์ที่เปิดรับจาก Supabase
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let live = true;
    fetchProjects()
      .then((rows) => {
        if (live) setProjects(rows);
      })
      .catch((err: unknown) => {
        if (live) setLoadError(err instanceof Error ? err.message : "โหลดโปรเจกต์ไม่สำเร็จ");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  // ทักษะของผู้ใช้ที่ล็อกอินอยู่ ใช้ไฮไลต์/กรองโปรเจกต์ที่ตรงกับสกิล (ยังไม่ล็อกอิน = ไม่มีปุ่มกรอง)
  const [userSkillNames, setUserSkillNames] = useState<string[]>([]);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let live = true;
    fetchMyProfile()
      .then((me) => {
        if (!live) return;
        setSignedIn(!!me);
        setUserSkillNames(me ? me.skills.map((s) => s.name) : []);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  // หมวดหมู่ทั้งหมด
  const categories = ["all", "Web", "Mobile", "AI/ML"];

  // กรองโปรเจกต์
  const filteredProjects = projects.filter((p) => {
    // 1. กรองคำค้นหา
    if (searchTerm) {
      const matchTitle = p.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDesc = p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSkill = p.requiredSkills.some((s) =>
        s.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!matchTitle && !matchDesc && !matchSkill) return false;
    }

    // 2. กรองหมวดหมู่
    if (selectedCategory !== "all" && p.category !== selectedCategory) {
      return false;
    }

    // 3. กรองตามทักษะของผู้ใช้ (US-05)
    if (filterByUserSkills) {
      const hasMatchingSkill = p.requiredSkills.some((skill) =>
        userSkillNames.includes(skill)
      );
      if (!hasMatchingSkill) return false;
    }

    return true;
  });

  return (
    <div className="space-y-8">
      {/* ส่วนหัวหน้าแสดงโปรเจกต์ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-100 mb-1">
            US-05: Search & Filter Projects
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            สำรวจโปรเจกต์ที่เปิดรับสมัคร
          </h1>
          <p className="text-xs text-slate-500">
            ค้นหาโปรเจกต์ที่ตรงกับความสนใจและทักษะของคุณ เพื่อเข้าร่วมสร้างผลงาน
          </p>
        </div>

        <Link
          href="/projects/create"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition text-center"
        >
          + สร้างโพสต์โปรเจกต์ใหม่ (US-01)
        </Link>
      </div>

      {/* แถบเครื่องมือค้นหาและฟิลเตอร์ */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* ช่องค้นหา */}
          <div className="sm:col-span-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 ค้นหาชื่อโปรเจกต์ คำอธิบาย หรือทักษะที่ต้องการ..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* เลือกหมวดหมู่ */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
            >
              <option value="all">ทุกหมวดหมู่ (All Categories)</option>
              <option value="Web">Web Application</option>
              <option value="Mobile">Mobile Application</option>
              <option value="AI/ML">AI / Machine Learning</option>
            </select>
          </div>
        </div>

        {/* ปุ่มลัดกรองตามทักษะของผู้ใช้ (US-05) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {signedIn ? (
          <button
            type="button"
            onClick={() => setFilterByUserSkills(!filterByUserSkills)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              filterByUserSkills
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            {filterByUserSkills
              ? "✓ กำลังกรองเฉพาะโปรเจกต์ที่ตรงกับสกิลของคุณ"
              : "🎯 แนะนำเฉพาะโปรเจกต์ที่ตรงกับสกิลของฉัน (US-05)"}
          </button>
          ) : (
            <Link href="/auth" className="text-xs font-bold text-blue-600 hover:underline">
              เข้าสู่ระบบเพื่อกรองโปรเจกต์ตามสกิลของคุณ
            </Link>
          )}

          <span className="text-xs text-slate-400">
            พบ {filteredProjects.length} โปรเจกต์
          </span>
        </div>
      </div>

      {/* รายการโปรเจกต์ Project Cards Grid */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm text-xs text-slate-500">
          กำลังโหลดโปรเจกต์...
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-xs text-red-600 font-medium">
          ⚠️ {loadError}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm space-y-3">
          <span className="text-4xl">📂</span>
          <h3 className="font-bold text-slate-900 text-base">ไม่พบโปรเจกต์ที่ตรงกับเงื่อนไข</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            ลองปรับเปลี่ยนคำค้นหา หรือสร้างโปรเจกต์ใหม่ด้วยตัวคุณเอง
          </p>
          <button
            onClick={() => { setSearchTerm(""); setSelectedCategory("all"); setFilterByUserSkills(false); }}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            ล้างตัวกรอง
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project) => {
            // ตรวจสอบว่าโปรเจกต์นี้มีทักษะตรงกับเรากี่อัน
            const matchedSkillsCount = project.requiredSkills.filter((s) =>
              userSkillNames.includes(s)
            ).length;

            return (
              <div
                key={project.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition"
              >
                <div className="space-y-3.5">
                  {/* แถบหมวดหมู่และสถานะ */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {project.category}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {matchedSkillsCount > 0 && (
                        <span className="rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5">
                          ✓ ตรงกับคุณ {matchedSkillsCount} สกิล
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          project.status === "open"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {project.status === "open" ? "เปิดรับสมัคร" : "ปิดรับแล้ว"}
                      </span>
                    </div>
                  </div>

                  {/* ชื่อโปรเจกต์ */}
                  <h3 className="font-bold text-slate-900 text-lg leading-snug">
                    <Link href={`/projects/${project.id}`} className="hover:text-blue-600 transition">
                      {project.title}
                    </Link>
                  </h3>

                  {/* คำอธิบาย */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {project.description}
                  </p>

                  {/* ข้อมูลระยะเวลาและจำนวนสมาชิก */}
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
                    <span>⏱ ระยะเวลา: <strong className="text-slate-700">{project.duration}</strong></span>
                    <span>👥 สมาชิก: <strong className="text-slate-700">{project.currentMembers}/{project.maxMembers} คน</strong></span>
                  </div>

                  {/* ทักษะที่ต้องการ (Required Skills) */}
                  <div className="pt-2">
                    <p className="text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                      ทักษะที่ต้องการ:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.requiredSkills.map((skill) => {
                        const isMySkill = userSkillNames.includes(skill);
                        return (
                          <span
                            key={skill}
                            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                              isMySkill
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-slate-100 text-slate-600"
                            }`}
                            title={isMySkill ? "คุณมีทักษะนี้" : ""}
                          >
                            {isMySkill ? `★ ${skill}` : skill}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer ของการ์ด */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    สร้างโดย: <strong className="text-slate-600">
                      {project.ownerId ? (
                        <Link href={`/members/${project.ownerId}`} className="hover:text-blue-600 hover:underline transition">
                          {project.ownerName}
                        </Link>
                      ) : (
                        project.ownerName
                      )}
                    </strong>
                  </span>

                  <Link
                    href={`/projects/${project.id}`}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition"
                  >
                    ดูรายละเอียด & สมัคร (US-06/07) →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
