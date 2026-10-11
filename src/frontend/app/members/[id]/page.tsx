"use client";

// ==============================================================================
// app/members/[id]/page.tsx
// โปรไฟล์ของสมาชิกคนอื่น: รูป ชื่อ คณะ/ชั้นปี bio ทักษะ ลิงก์ผลงาน
// พร้อมปุ่ม Bookmark และชวนเข้าโปรเจกต์ของเรา (ใช้ฟังก์ชันเดียวกับหน้า Matching)
// ข้อมูลที่แสดงเป็นชุดเดียวกับที่ผู้ล็อกอินเห็นอยู่แล้วในหน้า Matching (ไม่แสดงอีเมล)
// ==============================================================================

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "../../../components/Avatar";
import { SkillBadge } from "../../../components/profile/SkillBadge";
import { fetchMemberProfile } from "../../../lib/db/profiles";
import { getCurrentUserId } from "../../../lib/db/auth";
import { addBookmark, fetchBookmarkIds, removeBookmark } from "../../../lib/db/bookmarks";
import { fetchMyOwnedProjects, type OwnedProject } from "../../../lib/db/projects";
import { fetchInvitedRecipientIds, sendInvitation } from "../../../lib/db/invitations";
import { UNNAMED } from "../../../lib/db/mappers";
import type { User } from "../../../types";

type Notice = { kind: "ok" | "error"; text: string };

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const memberId = use(params).id;
  const router = useRouter();

  const [member, setMember] = useState<User | null>(null);
  const [meId, setMeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [bookmarked, setBookmarked] = useState(false);
  const [myProjects, setMyProjects] = useState<OwnedProject[]>([]);
  const [inviteProjectId, setInviteProjectId] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [profile, uid, owned, bookmarks] = await Promise.all([
          fetchMemberProfile(memberId),
          getCurrentUserId(),
          fetchMyOwnedProjects(),
          fetchBookmarkIds(),
        ]);
        // รู้ว่าเชิญเขาเข้าโปรเจกต์แรกไปแล้วหรือยังก่อนแสดงผล ปุ่มจะไม่กระพริบ
        const invited = owned.length > 0 ? await fetchInvitedRecipientIds(owned[0].id) : [];
        if (!live) return;
        setMember(profile);
        setMeId(uid ?? "");
        setMyProjects(owned);
        setInviteProjectId(owned[0]?.id ?? "");
        setInvitedIds(invited);
        setBookmarked(bookmarks.includes(memberId));
      } catch (err) {
        if (live) setLoadError(err instanceof Error ? err.message : "โหลดโปรไฟล์ไม่สำเร็จ");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [memberId]);

  const handleChangeProject = async (projectId: string) => {
    setInviteProjectId(projectId);
    setInvitedIds([]);
    setNotice(null);
    try {
      setInvitedIds(await fetchInvitedRecipientIds(projectId));
    } catch (err) {
      setNotice({ kind: "error", text: err instanceof Error ? err.message : "โหลดรายชื่อที่เชิญแล้วไม่สำเร็จ" });
    }
  };

  const handleToggleBookmark = async () => {
    const was = bookmarked;
    setNotice(null);
    setBookmarked(!was);
    try {
      await (was ? removeBookmark(memberId) : addBookmark(memberId));
    } catch (err) {
      setBookmarked(was);
      setNotice({ kind: "error", text: err instanceof Error ? err.message : "บันทึก Bookmark ไม่สำเร็จ" });
    }
  };

  const handleInvite = async () => {
    if (!member || !inviteProjectId) return;
    setInviting(true);
    setNotice(null);
    try {
      await sendInvitation({ projectId: inviteProjectId, recipientId: member.id, role: inviteRole });
      setInvitedIds((prev) => [...prev, member.id]);
      setNotice({ kind: "ok", text: `ส่งคำเชิญให้ "${member.name}" เรียบร้อยแล้ว` });
    } catch (err) {
      setNotice({ kind: "error", text: err instanceof Error ? err.message : "ส่งคำเชิญไม่สำเร็จ" });
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm text-xs text-slate-500">
        กำลังโหลดโปรไฟล์...
      </div>
    );
  }

  if (loadError || !member) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <span className="text-4xl">🙈</span>
        <h1 className="font-bold text-slate-900 text-base">
          {loadError ? "โหลดโปรไฟล์ไม่สำเร็จ" : "ไม่พบโปรไฟล์นี้"}
        </h1>
        {loadError && <p className="text-xs text-red-600">{loadError}</p>}
        <Link href="/matching" className="inline-block text-xs font-bold text-blue-600 hover:underline">
          ← ไปหน้าค้นหาสมาชิก
        </Link>
      </div>
    );
  }

  const isSelf = member.id === meId;
  const alreadyInvited = invitedIds.includes(member.id);
  const skills = [...member.skills].sort((a, b) => b.level - a.level);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-xs font-bold text-slate-500 hover:text-blue-600 transition"
      >
        ← กลับ
      </button>

      {/* ส่วนหัว: รูป ชื่อ คณะ ชั้นปี */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar
            name={member.name}
            url={member.avatarUrl}
            zoomable
            className="h-28 w-28 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-3xl font-black text-white shadow-md"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 truncate">
              {member.name === UNNAMED ? "ยังไม่ได้ตั้งชื่อ" : member.name}
            </h1>
            <p className="text-sm text-slate-600">
              {member.faculty || "ยังไม่ระบุคณะ"} · ชั้นปี {member.year}
            </p>
            <p className="text-xs text-slate-400">
              {isSelf ? "นี่คือโปรไฟล์ของคุณ" : "โปรไฟล์นี้ผู้ใช้ที่ล็อกอินทุกคนมองเห็นได้"}
            </p>
          </div>

          {isSelf ? (
            <Link
              href="/profile"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-center text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
            >
              แก้ไขโปรไฟล์
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                bookmarked
                  ? "bg-amber-500 border-amber-500 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {bookmarked ? "★ บันทึกแล้ว" : "☆ บันทึกสมาชิก"}
            </button>
          )}
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h2 className="text-xs font-bold text-slate-700 mb-1">เกี่ยวกับฉัน</h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
            {member.bio || "ยังไม่มีข้อมูลแนะนำตัว"}
          </p>
        </div>
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

      {/* ชวนเข้าโปรเจกต์ (เฉพาะเมื่อดูโปรไฟล์คนอื่น) */}
      {!isSelf && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">ชวนเข้าร่วมโปรเจกต์ของคุณ</h2>
          {myProjects.length === 0 ? (
            <p className="text-xs text-slate-600">
              คุณยังไม่มีโปรเจกต์ที่เปิดรับสมาชิก{" "}
              <Link href="/projects/create" className="font-bold text-blue-600 hover:underline">
                สร้างโปรเจกต์
              </Link>{" "}
              ก่อนจึงจะชวนสมาชิกเข้าทีมได้
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">โปรเจกต์</label>
                <select
                  value={inviteProjectId}
                  onChange={(e) => handleChangeProject(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  {myProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">ตำแหน่งที่ต้องการ (ไม่บังคับ)</label>
                <input
                  type="text"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  placeholder="เช่น Frontend Developer"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleInvite}
                disabled={alreadyInvited || inviting}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm ${
                  alreadyInvited
                    ? "bg-emerald-100 text-emerald-700 cursor-default"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 disabled:opacity-60"
                }`}
              >
                {alreadyInvited ? "✓ ส่งคำเชิญแล้ว" : inviting ? "กำลังส่ง..." : "ชวนเข้าทีม"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ทักษะ */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">ทักษะ ({skills.length})</h2>
        {skills.length === 0 ? (
          <p className="text-xs text-slate-400">ยังไม่ได้เพิ่มทักษะ</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {skills.map((skill) => (
              <SkillBadge key={skill.id} skill={skill} readOnly />
            ))}
          </div>
        )}
        <p className="text-[11px] text-slate-400">ระดับความถนัดเป็นการประเมินด้วยตนเองของเจ้าของโปรไฟล์</p>
      </div>

      {/* ลิงก์ผลงาน */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900">ลิงก์ผลงาน</h2>
        {!member.githubUrl && !member.behanceUrl ? (
          <p className="text-xs text-slate-400">ยังไม่ได้แนบลิงก์ผลงาน</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {member.githubUrl && (
              <a
                href={member.githubUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
              >
                GitHub ↗
              </a>
            )}
            {member.behanceUrl && (
              <a
                href={member.behanceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
              >
                Behance / Figma ↗
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
