"use client";

// ==============================================================================
// app/matching/page.tsx
// โมดูลค้นหาสมาชิกตามสกิล (Punnawit_SkillRequire)
// คัดกรองตามทักษะ คณะ ชั้นปี พร้อมคำนวณ Match Score (%) และปุ่ม Bookmark / ชวนเข้าทีม
// ข้อมูลทั้งหมดมาจาก Supabase: สมาชิก (profiles), Bookmark, โปรเจกต์ของฉัน, คำเชิญ
// ==============================================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { SKILL_OPTIONS } from "../../lib/skills";
import { YEAR_OPTIONS } from "../../lib/options";
import { fetchMembers } from "../../lib/db/members";
import { fetchBookmarkIds, addBookmark, removeBookmark } from "../../lib/db/bookmarks";
import { fetchMyOwnedProjects, type OwnedProject } from "../../lib/db/projects";
import { fetchInvitedRecipientIds, sendInvitation } from "../../lib/db/invitations";
import { User } from "../../types";
import { MemberCard } from "../../components/matching/MemberCard";

type Notice = { kind: "ok" | "error"; text: string };

export default function MatchingPage() {
  // ข้อมูลจาก Supabase
  const [candidates, setCandidates] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // สเตตคำค้นหา
  const [searchTerm, setSearchTerm] = useState("");

  // สเตตตัวกรองทักษะที่เลือก (Selected Skill Tags) — เริ่มต้นเป็นทักษะที่โปรเจกต์ที่เลือกต้องการ
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // สเตตตัวกรองคณะและชั้นปี
  const [selectedFaculty, setSelectedFaculty] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  // สเตตรายการสมาชิกที่ Bookmark ไว้
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);

  // การชวนเข้าทีม: โปรเจกต์ที่เราเป็นเจ้าของ, ตำแหน่ง, และคนที่เชิญเข้าโปรเจกต์นั้นไปแล้ว
  const [myProjects, setMyProjects] = useState<OwnedProject[]>([]);
  const [inviteProjectId, setInviteProjectId] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([fetchMembers(), fetchBookmarkIds(), fetchMyOwnedProjects()])
      .then(async ([members, bookmarks, owned]) => {
        // รู้ว่าเชิญใครเข้าโปรเจกต์แรกไปแล้วก่อนแสดงผล ปุ่มจะไม่กระพริบจาก "ชวนเข้าทีม" เป็น "ส่งคำเชิญแล้ว"
        const invited = owned.length > 0 ? await fetchInvitedRecipientIds(owned[0].id) : [];
        if (!live) return;
        setCandidates(members);
        setBookmarkedIds(bookmarks);
        setMyProjects(owned);
        setInvitedIds(invited);
        if (owned.length > 0) {
          setInviteProjectId(owned[0].id);
          setSelectedSkills(owned[0].requiredSkills);
        }
      })
      .catch((err: unknown) => {
        if (live) setLoadError(err instanceof Error ? err.message : "โหลดข้อมูลสมาชิกไม่สำเร็จ");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  // เปลี่ยนโปรเจกต์ที่จะชวนเข้า: ตั้งตัวกรองเป็นทักษะของโปรเจกต์นั้น และโหลดรายชื่อที่เชิญไปแล้ว
  const handleChangeInviteProject = async (projectId: string) => {
    setInviteProjectId(projectId);
    setInvitedIds([]);
    setNotice(null);
    const project = myProjects.find((p) => p.id === projectId);
    if (project) setSelectedSkills(project.requiredSkills);
    try {
      setInvitedIds(await fetchInvitedRecipientIds(projectId));
    } catch (err) {
      setNotice({ kind: "error", text: err instanceof Error ? err.message : "โหลดรายชื่อที่เชิญแล้วไม่สำเร็จ" });
    }
  };

  // สลับการเลือก Skill Tag ในตัวกรอง
  const toggleSkillFilter = (skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, skillName]);
    }
  };

  // ปุ่มล้างตัวกรองทั้งหมด (Clear filters)
  const handleClearFilters = () => {
    setSelectedSkills([]);
    setSelectedFaculty("all");
    setSelectedYear("all");
    setSearchTerm("");
    setShowOnlyBookmarks(false);
  };

  // สลับสถานะ Bookmark (อัปเดตหน้าทันที แล้วบันทึกลง DB; ล้มเหลวให้ย้อนกลับ)
  const handleToggleBookmark = async (memberId: string) => {
    const wasBookmarked = bookmarkedIds.includes(memberId);
    setNotice(null);
    setBookmarkedIds(
      wasBookmarked ? bookmarkedIds.filter((id) => id !== memberId) : [...bookmarkedIds, memberId]
    );
    try {
      await (wasBookmarked ? removeBookmark(memberId) : addBookmark(memberId));
    } catch (err) {
      setBookmarkedIds((prev) =>
        wasBookmarked ? [...prev, memberId] : prev.filter((id) => id !== memberId)
      );
      setNotice({ kind: "error", text: err instanceof Error ? err.message : "บันทึก Bookmark ไม่สำเร็จ" });
    }
  };

  // จัดการการส่งคำเชิญเข้าทีม
  const handleInviteMember = async (member: User) => {
    if (!inviteProjectId) return;
    setNotice(null);
    try {
      await sendInvitation({ projectId: inviteProjectId, recipientId: member.id, role: inviteRole });
      setInvitedIds((prev) => [...prev, member.id]);
      setNotice({ kind: "ok", text: `ส่งคำเชิญให้ "${member.name}" เรียบร้อยแล้ว` });
    } catch (err) {
      setNotice({ kind: "error", text: err instanceof Error ? err.message : "ส่งคำเชิญไม่สำเร็จ" });
    }
  };

  // คำนวณ Match Score (%) และแยกทักษะที่ Matched / Missing
  // ยังไม่เลือกทักษะที่ต้องการ = ไม่มีคะแนน (score เป็น null)
  const calculateMatch = (member: User) => {
    const memberSkillNames = member.skills.map((s) => s.name);

    if (selectedSkills.length === 0) {
      return { score: null as number | null, matched: [] as string[], missing: memberSkillNames };
    }

    const matched = selectedSkills.filter((s) => memberSkillNames.includes(s));
    const missing = memberSkillNames.filter((s) => !selectedSkills.includes(s));

    // คำนวณเปอร์เซ็นต์ความตรงกัน
    const score = Math.round((matched.length / selectedSkills.length) * 100);

    return { score: score as number | null, matched, missing };
  };

  // กรองสมาชิกตามเงื่อนไขทั้งหมด แล้วเรียงคนที่ตรงมากที่สุดก่อน
  const results = candidates
    .filter((candidate) => {
      // กรอง Bookmark
      if (showOnlyBookmarks && !bookmarkedIds.includes(candidate.id)) {
        return false;
      }

      // กรองคำค้นหา (ชื่อ หรือ แนะนำตัว)
      if (searchTerm) {
        const matchName = candidate.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchBio = candidate.bio.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchName && !matchBio) return false;
      }

      // กรองคณะ
      if (selectedFaculty !== "all" && !candidate.faculty.includes(selectedFaculty)) {
        return false;
      }

      // กรองชั้นปี
      if (selectedYear !== "all" && candidate.year.toString() !== selectedYear) {
        return false;
      }

      // กรองทักษะ: ถ้าเลือกทักษะไว้ ให้ผ่านเฉพาะคนที่มีทักษะตรงอย่างน้อย 1 รายการ
      if (selectedSkills.length > 0) {
        const memberSkillNames = candidate.skills.map((s) => s.name);
        const hasAnySkill = selectedSkills.some((s) => memberSkillNames.includes(s));
        if (!hasAnySkill) return false;
      }

      return true;
    })
    .map((candidate) => ({ candidate, ...calculateMatch(candidate) }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  // ตัวเลือกคณะจากข้อมูลจริงของสมาชิกในระบบ
  const facultyOptions = [...new Set(candidates.map((c) => c.faculty).filter(Boolean))];

  // ชิปทักษะ: รายการมาตรฐาน + ทักษะที่เลือกอยู่แต่ไม่อยู่ในรายการ (เช่น ทักษะที่โปรเจกต์พิมพ์เอง)
  const skillChips: string[] = [...SKILL_OPTIONS];
  selectedSkills.forEach((s) => {
    if (!skillChips.includes(s)) skillChips.push(s);
  });

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm text-xs text-slate-500">
        กำลังโหลดรายชื่อสมาชิก...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-xs text-red-600 font-medium">
        ⚠️ {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ส่วนหัวหน้าโมดูล */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-100 mb-1">
            Punnawit_SkillRequire
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            ค้นหาสมาชิกตามทักษะ (Skill Matching)
          </h1>
          <p className="text-xs text-slate-500">
            ระบบคำนวณ Match Score (%) เพื่อหาเพื่อนร่วมทีมที่มีความเชี่ยวชาญตรงกับที่โปรเจกต์คุณขาด
          </p>
        </div>

        {/* ปุ่มสลับดูเฉพาะ Bookmark */}
        <button
          onClick={() => setShowOnlyBookmarks(!showOnlyBookmarks)}
          className={`rounded-xl border px-4 py-2 text-xs font-bold transition shadow-sm ${
            showOnlyBookmarks
              ? "bg-amber-500 border-amber-500 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          ★ ดูเฉพาะที่บันทึกไว้ ({bookmarkedIds.length})
        </button>
      </div>

      {/* เลือกโปรเจกต์ที่จะชวนสมาชิกเข้าทีม */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
        {myProjects.length === 0 ? (
          <p className="text-xs text-slate-600">
            คุณยังไม่มีโปรเจกต์ที่เปิดรับสมาชิก{" "}
            <Link href="/projects/create" className="font-bold text-blue-600 hover:underline">
              สร้างโปรเจกต์
            </Link>{" "}
            ก่อนจึงจะชวนสมาชิกเข้าทีมได้
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชวนสมาชิกเข้าโปรเจกต์ (เลือกแล้วระบบจะตั้งตัวกรองเป็นทักษะที่โปรเจกต์ต้องการ)
              </label>
              <select
                value={inviteProjectId}
                onChange={(e) => handleChangeInviteProject(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                {myProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ตำแหน่งที่ต้องการ (ไม่บังคับ)
              </label>
              <input
                type="text"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                placeholder="เช่น Frontend Developer"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {notice && (
        <div
          className={`rounded-xl border p-3 text-xs font-medium ${
            notice.kind === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          {notice.kind === "ok" ? "✓" : "⚠️"} {notice.text}
        </div>
      )}

      {/* แถบตัวกรองและช่องค้นหา (Filters Box) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">

        {/* ช่องค้นหาข้อความ และดรอปดาวน์คณะ/ชั้นปี */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 ค้นหาด้วยชื่อ หรือประวัติสั้นๆ..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
            >
              <option value="all">ทุกคณะ</option>
              {facultyOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
            >
              <option value="all">ทุกชั้นปี</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  ชั้นปี {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* แถบเลือกแท็กทักษะที่ต้องการค้นหา (Skill Filter Chips) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">
              ทักษะที่ต้องการหาในทีม (คลิกเพื่อเลือก/ยกเลิก):
            </span>
            {(selectedSkills.length > 0 || selectedFaculty !== "all" || selectedYear !== "all") && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-red-500 hover:underline"
              >
                ล้างตัวกรองทั้งหมด (Clear filters)
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {skillChips.map((skillName) => {
              const isSelected = selectedSkills.includes(skillName);
              return (
                <button
                  key={skillName}
                  onClick={() => toggleSkillFilter(skillName)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {isSelected ? `✓ ${skillName}` : `+ ${skillName}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* แสดงสรุปตัวกรองที่เลือกในขณะนี้ */}
        {selectedSkills.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>ทักษะที่เลือก ({selectedSkills.length}):</span>
            <div className="flex flex-wrap gap-1">
              {selectedSkills.map((s) => (
                <span
                  key={s}
                  onClick={() => toggleSkillFilter(s)}
                  className="cursor-pointer rounded bg-blue-50 text-blue-700 px-2 py-0.5 text-[11px] font-bold hover:bg-red-50 hover:text-red-600 transition"
                  title="คลิกเพื่อลบแท็กนี้"
                >
                  {s} ✕
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* สรุปจำนวนผลลัพธ์ */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600">
          พบสมาชิกที่ตรงตามเงื่อนไข{" "}
          <strong className="text-blue-600 font-extrabold">{results.length}</strong> คน
        </p>
      </div>

      {/* รายการการ์ดผู้สมัคร MemberCard Grid */}
      {results.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm space-y-3">
          <span className="text-4xl">🔍</span>
          {candidates.length === 0 ? (
            <>
              <h3 className="font-bold text-slate-900 text-base">ยังไม่มีสมาชิกคนอื่นในระบบ</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                เมื่อมีนิสิตคนอื่นสมัครและกรอกทักษะ จะแสดงที่นี่
              </p>
            </>
          ) : (
            <>
              <h3 className="font-bold text-slate-900 text-base">ไม่พบสมาชิกตามตัวกรองที่เลือก</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                ลองล้างตัวกรองหรือเลือกทักษะอื่นๆ เพิ่มเติมเพื่อค้นหาเพื่อนร่วมทีม
              </p>
              <button
                onClick={handleClearFilters}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map(({ candidate, score, matched, missing }) => (
            <MemberCard
              key={candidate.id}
              member={candidate}
              matchScore={score}
              matchedSkills={matched}
              missingSkills={missing}
              isBookmarked={bookmarkedIds.includes(candidate.id)}
              invited={invitedIds.includes(candidate.id)}
              canInvite={!!inviteProjectId}
              onToggleBookmark={handleToggleBookmark}
              onInvite={handleInviteMember}
            />
          ))}
        </div>
      )}
    </div>
  );
}
