"use client";

// ==============================================================================
// components/matching/MemberCard.tsx
// การ์ดแสดงข้อมูลผู้สมัคร / สมาชิก พร้อมวงกลมเปอร์เซ็นต์ Match Score
// ==============================================================================

import Link from "next/link";
import { User } from "../../types";
import { Avatar } from "../Avatar";

interface MemberCardProps {
  member: User;
  // null = ยังไม่ได้เลือกทักษะที่ต้องการ จึงยังไม่มีคะแนนให้คำนวณ
  matchScore: number | null;
  matchedSkills: string[];
  missingSkills: string[];
  isBookmarked: boolean;
  // เชิญเข้าโปรเจกต์ที่เลือกอยู่ไปแล้ว (มาจาก DB) / เชิญได้หรือไม่ (ต้องมีโปรเจกต์ที่เป็นเจ้าของ)
  invited: boolean;
  canInvite: boolean;
  onToggleBookmark: (memberId: string) => void;
  onInvite: (member: User) => void;
}

export function MemberCard({
  member,
  matchScore,
  matchedSkills,
  missingSkills,
  isBookmarked,
  invited,
  canInvite,
  onToggleBookmark,
  onInvite,
}: MemberCardProps) {
  // คำนวณสีของวงกลม Match Score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 border-emerald-500 bg-emerald-50";
    if (score >= 60) return "text-blue-600 border-blue-500 bg-blue-50";
    if (score >= 40) return "text-amber-600 border-amber-500 bg-amber-50";
    return "text-slate-600 border-slate-300 bg-slate-50";
  };

  const handleInviteClick = () => {
    onInvite(member);
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-300">
      <div>
        {/* แถวบน: ข้อมูลสมาชิก + วงกลม Match Score + ปุ่ม Bookmark */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar รูปหรือชื่อย่อ */}
            <Avatar
              name={member.name}
              url={member.avatarUrl}
              className="h-12 w-12 rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm"
              zoomable
            />
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                <Link href={`/members/${member.id}`} className="hover:text-blue-600 hover:underline transition">
                  {member.name}
                </Link>
              </h3>
              <p className="text-xs text-slate-500">
                {member.faculty} · ชั้นปี {member.year}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* วงกลมเปอร์เซ็นต์ Match Score (แสดงเมื่อเลือกทักษะที่ต้องการแล้วเท่านั้น) */}
            {matchScore !== null && (
              <div
                className={`flex h-11 w-11 flex-col items-center justify-center rounded-full border-2 font-black text-xs shadow-sm ${getScoreColor(
                  matchScore
                )}`}
                title={`ความเข้ากันได้ ${matchScore}%`}
              >
                <span>{matchScore}%</span>
              </div>
            )}

            {/* ปุ่ม Bookmark */}
            <button
              onClick={() => onToggleBookmark(member.id)}
              className={`rounded-lg p-2 transition ${
                isBookmarked
                  ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              }`}
              title={isBookmarked ? "ยกเลิกบันทึก" : "บันทึกสมาชิก"}
              aria-label="Bookmark"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* ข้อความแนะนำตัวสั้นๆ */}
        <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {member.bio || "ยังไม่มีข้อมูลแนะนำตัว"}
        </p>

        {/* ส่วนแสดงทักษะที่ตรงกัน (Matched) — แสดงเมื่อมีทักษะที่ใช้กรองเท่านั้น */}
        {matchScore !== null && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1.5">
              ✓ ทักษะที่ตรงกัน ({matchedSkills.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.length > 0 ? (
                matchedSkills.map((skillName) => (
                  <span
                    key={skillName}
                    className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                  >
                    {skillName}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">ไม่มีทักษะตรงตามตัวกรอง</span>
              )}
            </div>
          </div>
        )}

        {/* ส่วนแสดงทักษะที่ยังขาด หรือทักษะอื่นๆ ของผู้สมัคร */}
        {missingSkills.length > 0 && (
          <div className="mt-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              ทักษะอื่นๆ ที่มี ({missingSkills.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.slice(0, 3).map((skillName) => (
                <span
                  key={skillName}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                >
                  {skillName}
                </span>
              ))}
              {missingSkills.length > 3 && (
                <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-400">
                  +{missingSkills.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ปุ่มกดเชิญเข้าทีม / สถานะ */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {member.skills.length} ทักษะรวม ·{" "}
          <Link href={`/members/${member.id}`} className="font-bold text-blue-600 hover:underline">
            ดูโปรไฟล์
          </Link>
        </span>

        <button
          onClick={handleInviteClick}
          disabled={invited || !canInvite}
          title={!canInvite ? "ต้องมีโปรเจกต์ที่เปิดรับของตัวเองก่อนจึงจะชวนสมาชิกได้" : undefined}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm ${
            invited
              ? "bg-emerald-100 text-emerald-700 cursor-default"
              : !canInvite
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
          }`}
        >
          {invited ? "✓ ส่งคำเชิญแล้ว" : "ชวนเข้าทีม"}
        </button>
      </div>
    </div>
  );
}
