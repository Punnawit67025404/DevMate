"use client";

// ==============================================================================
// app/myteam/page.tsx
// โมดูลเวิร์กสเปซทีม (Sirapat_Myteam)
// Layout 3 คอลัมน์: นัดหมาย/สมาชิก (ซ้าย) | แชตกลุ่ม (กลาง) | งาน & ตำแหน่งที่ขาด (ขวา)
// ข้อมูลทั้งหมดมาจาก Supabase: โปรเจกต์ที่เราเป็นสมาชิก, สมาชิก, นัดหมาย, แชต (realtime), งาน
// ==============================================================================

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChatSection } from "../../components/myteam/ChatSection";
import { TaskSection } from "../../components/myteam/TaskSection";
import { Avatar } from "../../components/Avatar";
import { getCurrentUserId } from "../../lib/db/auth";
import {
  fetchMyTeams,
  fetchTeamMembers,
  fetchPendingApplications,
  reviewApplication,
  subscribeTeamChanges,
  computeOpenRoles,
  type TeamProject,
  type TeamMember,
} from "../../lib/db/team";
import { fetchNextEvent, createEvent, type TeamEvent } from "../../lib/db/events";
import type { Application } from "../../types";

const dateText = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const timeText = (iso: string) =>
  `${new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false })} น.`;

export default function MyTeamPage() {
  const [teams, setTeams] = useState<TeamProject[]>([]);
  const [projectId, setProjectId] = useState("");
  const [meId, setMeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ข้อมูลของทีมที่เลือก
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [nextEvent, setNextEvent] = useState<TeamEvent | null>(null);
  const [pending, setPending] = useState<Application[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewingId, setReviewingId] = useState("");

  // ฟอร์มเพิ่มนัดหมาย
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventPlatform, setEventPlatform] = useState("Google Meet");
  const [eventLink, setEventLink] = useState("");
  const [eventError, setEventError] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);

  const team = teams.find((t) => t.id === projectId) ?? null;
  const isOwner = !!team && team.ownerId === meId;

  useEffect(() => {
    let live = true;
    Promise.all([fetchMyTeams(), getCurrentUserId()])
      .then(([myTeams, uid]) => {
        if (!live) return;
        setTeams(myTeams);
        setMeId(uid ?? "");
        if (myTeams.length > 0) setProjectId(myTeams[0].id);
        else setTeamLoading(false);
      })
      .catch((err: unknown) => {
        if (live) setLoadError(err instanceof Error ? err.message : "โหลดข้อมูลทีมไม่สำเร็จ");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  // silent = รีเฟรชเบื้องหลัง (realtime/ตั้งเวลา) ไม่แสดง error รบกวนถ้าล้มเหลวชั่วคราว
  const loadTeam = useCallback(async (id: string, owner: boolean, silent = false) => {
    if (!silent) setTeamError("");
    try {
      const [teamMembers, event, applications] = await Promise.all([
        fetchTeamMembers(id),
        fetchNextEvent(id),
        owner ? fetchPendingApplications(id) : Promise.resolve([] as Application[]),
      ]);
      // ถ้าข้อมูลเหมือนเดิมให้คง reference เดิมไว้ ไม่ให้ส่วนอื่นของหน้า render/โหลดซ้ำโดยไม่จำเป็น
      setMembers((prev) => (JSON.stringify(prev) === JSON.stringify(teamMembers) ? prev : teamMembers));
      setNextEvent((prev) => (JSON.stringify(prev) === JSON.stringify(event) ? prev : event));
      setPending((prev) => (JSON.stringify(prev) === JSON.stringify(applications) ? prev : applications));
    } catch (err) {
      if (!silent) setTeamError(err instanceof Error ? err.message : "โหลดข้อมูลทีมไม่สำเร็จ");
    } finally {
      setTeamLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!projectId) return;
    void loadTeam(projectId, isOwner);
  }, [projectId, isOwner, loadTeam]);

  // อัปเดตสดโดยไม่ต้องรีเฟรชหน้า: ใบสมัครใหม่/ที่ถูกพิจารณา, ผู้ตอบรับคำเชิญ, นัดหมายใหม่
  useEffect(() => {
    if (!projectId || !meId) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    // รวมเหตุการณ์ที่มาติดๆ กันให้เหลือการโหลดครั้งเดียว
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void loadTeam(projectId, isOwner, true), 300);
    };

    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeTeamChanges(projectId, refresh);
    } catch {
      // ต่อ realtime ไม่ได้: ยังมีการดึงข้อมูลสำรองด้านล่าง
    }

    // สำรอง: สมาชิกที่ไม่ใช่เจ้าของไม่ได้รับเหตุการณ์ใบสมัครของคนอื่น (RLS) จึงดึงใหม่เป็นระยะขณะเปิดหน้าอยู่
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") void loadTeam(projectId, isOwner, true);
    }, 30000);

    return () => {
      clearTimeout(timer);
      clearInterval(poll);
      unsubscribe();
    };
  }, [projectId, meId, isOwner, loadTeam]);

  const handleSwitchProject = (id: string) => {
    setTeamLoading(true);
    setMembers([]);
    setNextEvent(null);
    setPending([]);
    setNotice("");
    setShowEventForm(false);
    setProjectId(id);
  };

  const handleReview = async (application: Application, decision: "approved" | "rejected") => {
    setReviewingId(application.id);
    setNotice("");
    setTeamError("");
    try {
      await reviewApplication(application.id, decision);
      await loadTeam(projectId, isOwner);
      setNotice(
        decision === "approved"
          ? `อนุมัติ "${application.applicantName}" เข้าทีมแล้ว`
          : `ปฏิเสธใบสมัครของ "${application.applicantName}" แล้ว`
      );
    } catch (err) {
      setTeamError(err instanceof Error ? err.message : "พิจารณาใบสมัครไม่สำเร็จ");
    } finally {
      setReviewingId("");
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventError("");
    setSavingEvent(true);
    try {
      await createEvent({
        projectId,
        title: eventTitle,
        startsAt: eventStart ? new Date(eventStart).toISOString() : "",
        endsAt: eventEnd ? new Date(eventEnd).toISOString() : null,
        platform: eventPlatform,
        link: eventLink,
      });
      setEventTitle("");
      setEventStart("");
      setEventEnd("");
      setEventLink("");
      setShowEventForm(false);
      await loadTeam(projectId, isOwner);
      setNotice("เพิ่มนัดหมายเรียบร้อยแล้ว");
    } catch (err) {
      setEventError(err instanceof Error ? err.message : "เพิ่มนัดหมายไม่สำเร็จ");
    } finally {
      setSavingEvent(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm text-xs text-slate-500">
        กำลังโหลดข้อมูลทีม...
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

  if (!team) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm space-y-3">
        <span className="text-4xl">👥</span>
        <h1 className="font-bold text-slate-900 text-base">คุณยังไม่ได้เป็นสมาชิกของทีมไหน</h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          สร้างโปรเจกต์ของคุณเอง หรือสมัคร/ตอบรับคำเชิญเข้าร่วมโปรเจกต์ของเพื่อน แล้วทีมจะแสดงที่นี่
        </p>
        <div className="flex justify-center gap-2 pt-1">
          <Link
            href="/projects/create"
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            + สร้างโปรเจกต์
          </Link>
          <Link
            href="/projects"
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            สำรวจโปรเจกต์
          </Link>
        </div>
      </div>
    );
  }

  const nameById = Object.fromEntries(members.map((m) => [m.id, m.name]));
  const { missingSkills, openSeats } = computeOpenRoles(team, members);

  return (
    <div className="space-y-6">

      {/* ส่วนหัวหน้าเวิร์กสเปซ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-100 mb-1">
            Sirapat_Myteam: 3-Column Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{team.title}</h1>
          <p className="text-xs text-slate-500">
            ศูนย์กลางการสื่อสาร นัดหมาย และติดตามความคืบหน้างานของสมาชิกในทีม
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {teams.length > 1 && (
            <select
              value={projectId}
              onChange={(e) => handleSwitchProject(e.target.value)}
              aria-label="เลือกทีม/โปรเจกต์"
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          )}
          <span className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
            🟢 สมาชิกในทีม {members.length}/{team.maxMembers} คน
          </span>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 font-medium">
          ✓ {notice}
        </div>
      )}
      {teamError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 font-medium">
          ⚠️ {teamError}
        </div>
      )}

      {/* ================================================================== */}
      {/* LAYOUT 3 คอลัมน์ (นัดหมาย/ซ้าย | แชต/กลาง | งาน/ขวา) */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ---------------------------------------------------------------- */}
        {/* คอลัมน์ซ้าย (LG: 3 ส่วน): นัดหมาย & สมาชิก */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-3 space-y-5">

          {/* กล่องการนัดหมายครั้งถัดไป (Next Meeting) */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                📅 Next Meeting
              </span>
              <button
                type="button"
                onClick={() => setShowEventForm(!showEventForm)}
                className="text-[11px] font-bold text-blue-100 hover:text-white underline"
              >
                {showEventForm ? "ยกเลิก" : "+ นัดหมายใหม่"}
              </button>
            </div>

            {nextEvent ? (
              <>
                <h3 className="font-extrabold text-sm leading-snug">{nextEvent.title}</h3>

                <div className="text-xs text-blue-100 space-y-1">
                  <p>🗓 {dateText(nextEvent.startsAt)}</p>
                  <p>
                    ⏰ {timeText(nextEvent.startsAt)}
                    {nextEvent.endsAt ? ` - ${timeText(nextEvent.endsAt)}` : ""}
                  </p>
                  {nextEvent.platform && <p>💻 {nextEvent.platform}</p>}
                </div>

                {nextEvent.link && (
                  <a
                    href={nextEvent.link}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center rounded-xl bg-white py-2 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 transition"
                  >
                    เข้าร่วมการประชุม ↗
                  </a>
                )}
              </>
            ) : (
              !showEventForm && (
                <p className="text-xs text-blue-100">
                  {teamLoading ? "กำลังโหลด..." : "ยังไม่มีนัดหมายที่จะมาถึง กด \"+ นัดหมายใหม่\" เพื่อเพิ่ม"}
                </p>
              )
            )}

            {showEventForm && (
              <form onSubmit={handleCreateEvent} className="space-y-2 pt-1">
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="หัวข้อการประชุม"
                  className="w-full rounded-lg border border-white/30 bg-white/95 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                />
                <div className="grid grid-cols-1 gap-2">
                  <label className="text-[11px] text-blue-100">
                    เริ่ม
                    <input
                      type="datetime-local"
                      value={eventStart}
                      onChange={(e) => setEventStart(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-white/30 bg-white/95 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </label>
                  <label className="text-[11px] text-blue-100">
                    สิ้นสุด (ไม่บังคับ)
                    <input
                      type="datetime-local"
                      value={eventEnd}
                      onChange={(e) => setEventEnd(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-white/30 bg-white/95 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={eventPlatform}
                  onChange={(e) => setEventPlatform(e.target.value)}
                  placeholder="แพลตฟอร์ม เช่น Google Meet"
                  className="w-full rounded-lg border border-white/30 bg-white/95 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                />
                <input
                  type="url"
                  value={eventLink}
                  onChange={(e) => setEventLink(e.target.value)}
                  placeholder="ลิงก์ประชุม https://..."
                  className="w-full rounded-lg border border-white/30 bg-white/95 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                />
                {eventError && <p className="text-[11px] font-semibold text-amber-200">⚠️ {eventError}</p>}
                <button
                  type="submit"
                  disabled={savingEvent}
                  className="w-full rounded-xl bg-white py-2 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingEvent ? "กำลังบันทึก..." : "บันทึกนัดหมาย"}
                </button>
              </form>
            )}
          </div>

          {/* กล่องรายชื่อสมาชิกในทีม */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">สมาชิกในทีม ({members.length})</h3>
              <span className="text-[11px] text-slate-400">เต็มที่ {team.maxMembers} คน</span>
            </div>

            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <Avatar
                    name={m.name}
                    url={m.avatarUrl}
                    className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs shadow-xs"
                    zoomable
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      <Link href={`/members/${m.id}`} className="hover:text-blue-600 hover:underline transition">
                        {m.name}
                      </Link>
                      {m.id === meId ? " (ฉัน)" : ""}
                    </p>
                    <p className="text-[11px] text-slate-500">{m.role}</p>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-xs text-slate-400">{teamLoading ? "กำลังโหลด..." : "ไม่พบสมาชิก"}</p>
              )}
            </div>
          </div>

          {/* ใบสมัครที่รอพิจารณา (เฉพาะเจ้าของโปรเจกต์) */}
          {isOwner && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                <h3 className="font-bold text-slate-900 text-sm">ใบสมัครที่รอพิจารณา</h3>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-extrabold text-blue-700">
                  {pending.length}
                </span>
              </div>

              {pending.length === 0 ? (
                <p className="text-xs text-slate-400">ไม่มีใบสมัครที่รอพิจารณา</p>
              ) : (
                <div className="space-y-3">
                  {pending.map((app) => (
                    <div key={app.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar
                            name={app.applicantName}
                            url={app.applicantAvatarUrl}
                            className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px]"
                            zoomable
                          />
                          <strong className="text-slate-900 truncate">
                            <Link href={`/members/${app.applicantId}`} className="hover:text-blue-600 hover:underline transition">
                              {app.applicantName}
                            </Link>
                          </strong>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">{app.appliedAt}</span>
                      </div>
                      <p className="text-slate-600 whitespace-pre-wrap break-words">{app.message}</p>
                      <Link href={`/members/${app.applicantId}`} className="inline-block text-[11px] font-bold text-blue-600 hover:underline">
                        ดูโปรไฟล์ผู้สมัคร (ทักษะ/ผลงาน) →
                      </Link>
                      {app.portfolioLink && (
                        <a
                          href={app.portfolioLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-[11px] text-blue-600 hover:underline"
                        >
                          ดูผลงาน ↗
                        </a>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleReview(app, "approved")}
                          disabled={reviewingId === app.id || openSeats === 0}
                          title={openSeats === 0 ? "ทีมเต็มตามจำนวนที่ตั้งไว้แล้ว" : undefined}
                          className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => handleReview(app, "rejected")}
                          disabled={reviewingId === app.id}
                          className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ปฏิเสธ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* คอลัมน์กลาง (LG: 5 ส่วน): แชตกลุ่มทีม (ChatSection) */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-5 h-[580px]">
          {teamLoading ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-xs text-slate-400 shadow-sm">
              กำลังโหลดแชต...
            </div>
          ) : (
            <ChatSection
              key={projectId}
              projectId={projectId}
              teamName={team.title}
              memberCount={members.length}
              meId={meId}
              nameById={nameById}
            />
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* คอลัมน์ขวา (LG: 4 ส่วน): งาน (Tasks) & ตำแหน่งที่ขาด */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-4 space-y-5">

          {/* ส่วนแสดงรายการ Task ของทีม */}
          {!teamLoading && <TaskSection key={projectId} projectId={projectId} members={members} />}

          {/* กล่องตำแหน่งที่ยังขาดในทีม (คำนวณจากทักษะที่โปรเจกต์ต้องการเทียบกับทักษะของสมาชิก) */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-amber-900 text-sm">
                📢 ตำแหน่งที่ยังขาดในทีม
              </h3>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                {openSeats > 0 ? `รับเพิ่ม ${openSeats} คน` : "ทีมครบแล้ว"}
              </span>
            </div>

            {openSeats === 0 ? (
              <p className="text-xs text-amber-800/80 leading-relaxed">
                จำนวนสมาชิกครบตามที่ตั้งไว้ ({team.maxMembers} คน) แล้ว
              </p>
            ) : missingSkills.length === 0 ? (
              <p className="text-xs text-amber-800/80 leading-relaxed">
                สมาชิกปัจจุบันมีทักษะครอบคลุมที่โปรเจกต์ต้องการแล้ว
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-amber-800/80 leading-relaxed">
                  ทักษะที่โปรเจกต์ต้องการแต่ยังไม่มีสมาชิกคนไหนมี:
                </p>
                {missingSkills.map((skill) => (
                  <div
                    key={skill}
                    className="flex items-center justify-between rounded-xl bg-white border border-amber-200 p-2.5 text-xs shadow-xs"
                  >
                    <strong className="text-slate-800">{skill}</strong>
                    {isOwner && (
                      <Link
                        href="/matching"
                        className="rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-600 transition"
                      >
                        หาคนสกิลนี้ →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
