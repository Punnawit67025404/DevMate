"use client";

// ==============================================================================
// app/profile/page.tsx
// โมดูลจัดการโปรไฟล์และแท็กทักษะ (kittiphat_profile_tags)
// ข้อมูลทั้งหมดอ่าน/เขียนจาก Supabase: ข้อมูลนิสิต, ทักษะ (20-100%), ลิงก์ GitHub/Behance
// ==============================================================================

import { useEffect, useRef, useState } from "react";
import { SKILL_OPTIONS } from "../../lib/skills";
import { FACULTY_SUGGESTIONS, YEAR_OPTIONS } from "../../lib/options";
import { fetchMyProfile, saveProfile, saveSkills, savePortfolioLinks } from "../../lib/db/profiles";
import { avatarUrlOf, UNNAMED } from "../../lib/db/mappers";
import { removeAvatar, uploadAvatar } from "../../lib/db/avatars";
import { fetchMyInvites, respondToInvite } from "../../lib/db/invitations";
import { Skill, TeamInvite } from "../../types";
import { SkillBadge } from "../../components/profile/SkillBadge";
import { Avatar } from "../../components/Avatar";
import { PROFILE_UPDATED_EVENT } from "../../components/Navbar";

const URL_RE = /^https?:\/\/\S+$/i;

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ข้อมูลนิสิต (โหลดจาก Supabase)
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [year, setYear] = useState(1);
  const [bio, setBio] = useState("");
  const [infoError, setInfoError] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  // รูปโปรไฟล์
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // รายการทักษะ
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<number>(80);
  const [skillError, setSkillError] = useState("");
  const [savingSkill, setSavingSkill] = useState(false);

  // ลิงก์ Portfolio
  const [githubUrl, setGithubUrl] = useState("");
  const [behanceUrl, setBehanceUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [savingLinks, setSavingLinks] = useState(false);

  // คำเชิญเข้าทีมที่ส่งมาหาเรา
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [inviteError, setInviteError] = useState("");
  const [respondingId, setRespondingId] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let live = true;
    fetchMyInvites()
      .then((rows) => {
        if (live) setInvites(rows);
      })
      .catch((err: unknown) => {
        if (live) setInviteError(err instanceof Error ? err.message : "โหลดคำเชิญไม่สำเร็จ");
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    let live = true;
    fetchMyProfile()
      .then((me) => {
        if (!live) return;
        if (!me) {
          setLoadError("กรุณาเข้าสู่ระบบก่อนดูโปรไฟล์");
          return;
        }
        setEmail(me.email);
        setDisplayName(me.name === UNNAMED ? "" : me.name);
        setFaculty(me.faculty);
        setYear(me.year);
        setBio(me.bio);
        setAvatarUrl(me.avatarUrl);
        setSkills(me.skills);
        setGithubUrl(me.githubUrl ?? "");
        setBehanceUrl(me.behanceUrl ?? "");
      })
      .catch((err: unknown) => {
        if (live) setLoadError(err instanceof Error ? err.message : "โหลดโปรไฟล์ไม่สำเร็จ");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  // ยกเลิกตัวนับเวลาของข้อความก่อนหน้าเสมอ ไม่งั้นการทำหลายอย่างติดกันจะถูกตัวนับเก่าลบข้อความใหม่ก่อนเวลา
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flash = (message: string) => {
    clearTimeout(flashTimer.current);
    setSuccessMessage(message);
    flashTimer.current = setTimeout(() => setSuccessMessage(""), 3000);
  };

  // 0. บันทึกข้อมูลนิสิต (ชื่อ คณะ ชั้นปี bio)
  const handleSaveInfo = async () => {
    setInfoError("");
    setSavingInfo(true);
    try {
      await saveProfile({ displayName, faculty, year, bio });
      window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
      flash("บันทึกข้อมูลนิสิตเรียบร้อยแล้ว");
    } catch (err) {
      setInfoError(err instanceof Error ? err.message : "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSavingInfo(false);
    }
  };

  // อัปโหลด/เปลี่ยนรูปโปรไฟล์ (ย่อรูปในเบราว์เซอร์ก่อนส่ง)
  const handleAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // ให้เลือกไฟล์เดิมซ้ำได้
    if (!file) return;

    setAvatarError("");
    setAvatarBusy(true);
    try {
      const path = await uploadAvatar(file);
      setAvatarUrl(avatarUrlOf(path));
      window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
      flash("เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว");
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarError("");
    setAvatarBusy(true);
    try {
      await removeAvatar();
      setAvatarUrl(undefined);
      window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
      flash("ลบรูปโปรไฟล์แล้ว");
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "ลบรูปไม่สำเร็จ");
    } finally {
      setAvatarBusy(false);
    }
  };

  // 1. ฟังก์ชันเพิ่มทักษะใหม่ พร้อม Validation ป้องกันค่าว่างและค่าซ้ำ แล้วบันทึกลง DB
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSkillError("");

    const trimmedName = newSkillName.trim();

    // ตรวจสอบค่าว่าง
    if (!trimmedName) {
      setSkillError("กรุณาระบุชื่อทักษะ");
      return;
    }

    // ตรวจสอบทักษะซ้ำ
    const isDuplicate = skills.some((s) => s.name.toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
      setSkillError(`คุณมีทักษะ "${trimmedName}" อยู่ในรายการแล้ว`);
      return;
    }

    const next: Skill[] = [
      ...skills,
      { id: trimmedName.toLowerCase(), name: trimmedName, level: newSkillLevel },
    ];

    setSavingSkill(true);
    try {
      await saveSkills(next);
      setSkills(next);
      setNewSkillName("");
      flash(`เพิ่มทักษะ "${trimmedName}" เรียบร้อยแล้ว`);
    } catch (err) {
      setSkillError(err instanceof Error ? err.message : "บันทึกทักษะไม่สำเร็จ");
    } finally {
      setSavingSkill(false);
    }
  };

  // 2. ฟังก์ชันลบทักษะ (บันทึกลง DB ทันที)
  const handleDeleteSkill = async (skillId: string) => {
    setSkillError("");
    const next = skills.filter((s) => s.id !== skillId);
    try {
      await saveSkills(next);
      setSkills(next);
    } catch (err) {
      setSkillError(err instanceof Error ? err.message : "ลบทักษะไม่สำเร็จ");
    }
  };

  // 3. บันทึกลิงก์ผลงาน (ว่าง = ลบลิงก์นั้น)
  const handleSaveLinks = async () => {
    setLinkError("");
    const github = githubUrl.trim();
    const behance = behanceUrl.trim();

    if ((github && !URL_RE.test(github)) || (behance && !URL_RE.test(behance))) {
      setLinkError("ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://");
      return;
    }

    setSavingLinks(true);
    try {
      await savePortfolioLinks({ githubUrl: github, behanceUrl: behance });
      flash("บันทึกลิงก์ผลงานเรียบร้อยแล้ว");
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "บันทึกลิงก์ไม่สำเร็จ");
    } finally {
      setSavingLinks(false);
    }
  };

  // 4. ตอบรับหรือปฏิเสธคำเชิญทีม (บันทึกลง DB)
  const handleInviteResponse = async (inviteId: string, action: "accepted" | "rejected") => {
    setInviteError("");
    setRespondingId(inviteId);
    try {
      await respondToInvite(inviteId, action);
      setInvites((prev) => prev.map((inv) => (inv.id === inviteId ? { ...inv, status: action } : inv)));
      flash(action === "accepted" ? "ตอบรับคำเชิญแล้ว คุณเป็นสมาชิกของโปรเจกต์นี้แล้ว" : "ปฏิเสธคำเชิญแล้ว");
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "ตอบคำเชิญไม่สำเร็จ");
    } finally {
      setRespondingId("");
    }
  };

  const pendingInvitesCount = invites.filter((inv) => inv.status === "pending").length;

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm text-xs text-slate-500">
        กำลังโหลดโปรไฟล์...
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
      {/* ส่วนหัวหน้าโปรไฟล์ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-100 mb-1">
            kittiphat_profile_tags
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            โปรไฟล์และคลังทักษะของฉัน
          </h1>
          <p className="text-xs text-slate-500">
            จัดการข้อมูลส่วนตัว ความเชี่ยวชาญ และตอบรับคำเชิญเข้าร่วมทีม
          </p>
        </div>

        {/* ป้ายนับจำนวนคำเชิญทีม */}
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm">
            📩 คำเชิญรอตอบรับ:{" "}
            <span className="text-blue-600 font-extrabold">{pendingInvitesCount} รายการ</span>
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 font-medium animate-fadeIn">
          ✓ {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* คอลัมน์ซ้าย: ข้อมูลส่วนตัวและลิงก์ Portfolio */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              ข้อมูลนิสิต
            </h2>

            <div className="flex items-center gap-4">
              <Avatar
                name={displayName || email}
                url={avatarUrl}
                className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xl font-black text-white shadow-md"
                zoomable
              />
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-base truncate">
                  {displayName || UNNAMED}
                </h3>
                <p className="text-xs text-slate-500 truncate">{email}</p>
              </div>
            </div>

            {/* อัปโหลด/เปลี่ยน/ลบรูปโปรไฟล์ */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  className={`inline-flex cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition ${
                    avatarBusy ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  {avatarBusy ? "กำลังดำเนินการ..." : avatarUrl ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarSelected}
                    disabled={avatarBusy}
                    aria-label="เลือกไฟล์รูปโปรไฟล์"
                    className="hidden"
                  />
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={avatarBusy}
                    className="rounded-xl px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 transition disabled:opacity-60"
                  >
                    ลบรูป
                  </button>
                )}
              </div>
              {avatarError && <p className="text-xs text-red-500 font-medium">⚠️ {avatarError}</p>}
              <p className="text-[11px] text-slate-400">
                รองรับ JPG, PNG, WebP (ระบบตัดเป็นสี่เหลี่ยมจัตุรัสและย่อให้อัตโนมัติ) รูปและข้อมูลโปรไฟล์ผู้ใช้ที่ล็อกอินทุกคนมองเห็นได้
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อที่แสดง *</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="เช่น ชื่อ-นามสกุล"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">คณะ</label>
                <input
                  type="text"
                  list="faculty-list"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  placeholder="เช่น วิศวกรรมศาสตร์"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
                <datalist id="faculty-list">
                  {FACULTY_SUGGESTIONS.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชั้นปี</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                >
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เกี่ยวกับฉัน (Bio)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            {infoError && <p className="text-xs text-red-500 font-medium">⚠️ {infoError}</p>}

            <button
              type="button"
              onClick={handleSaveInfo}
              disabled={savingInfo}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingInfo ? "กำลังบันทึก..." : "บันทึกข้อมูลนิสิต"}
            </button>
          </div>

          {/* กล่องใส่ลิงก์ GitHub & Behance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              ลิงก์ผลงาน (Portfolio)
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GitHub URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/your-username"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-[11px] text-blue-600 hover:underline mt-1"
                >
                  เปิดดู GitHub ↗
                </a>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Behance / Figma URL
              </label>
              <input
                type="url"
                value={behanceUrl}
                onChange={(e) => setBehanceUrl(e.target.value)}
                placeholder="https://behance.net/your-portfolio"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
              {behanceUrl && (
                <a
                  href={behanceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-[11px] text-blue-600 hover:underline mt-1"
                >
                  เปิดดู Behance ↗
                </a>
              )}
            </div>

            {linkError && <p className="text-xs text-red-500 font-medium">⚠️ {linkError}</p>}

            <button
              type="button"
              onClick={handleSaveLinks}
              disabled={savingLinks}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingLinks ? "กำลังบันทึก..." : "บันทึกลิงก์ผลงาน"}
            </button>
          </div>

          {/* กล่องรายการคำเชิญเข้าร่วมทีม (Team Invites) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                คำเชิญเข้าทีม (Invites)
              </h2>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-extrabold text-blue-700">
                {pendingInvitesCount}
              </span>
            </div>

            {inviteError && <p className="text-xs text-red-500 font-medium">⚠️ {inviteError}</p>}

            {invites.length === 0 ? (
              <p className="text-xs text-slate-400">ยังไม่มีคำเชิญเข้าทีมในขณะนี้</p>
            ) : (
              <div className="space-y-3">
                {invites.map((inv) => (
                  <div
                    key={inv.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <strong className="text-slate-900 font-bold">{inv.projectTitle}</strong>
                      <span className="text-[10px] text-slate-400 shrink-0">{inv.date}</span>
                    </div>
                    <p className="text-slate-600">
                      ชวนโดย: <strong>{inv.senderName}</strong>
                    </p>
                    <p className="text-slate-500 text-[11px]">ตำแหน่ง: {inv.role}</p>

                    {inv.status === "pending" ? (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleInviteResponse(inv.id, "accepted")}
                          disabled={respondingId === inv.id}
                          className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          ตอบรับ
                        </button>
                        <button
                          onClick={() => handleInviteResponse(inv.id, "rejected")}
                          disabled={respondingId === inv.id}
                          className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          ปฏิเสธ
                        </button>
                      </div>
                    ) : (
                      <div className="pt-1">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            inv.status === "accepted"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {inv.status === "accepted" ? "✓ คุณตอบรับแล้ว" : "✗ คุณปฏิเสธแล้ว"}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* คอลัมน์ขวา: จัดการคลังทักษะ (Skill Tags 20-100%) */}
        <div className="lg:col-span-2 space-y-6">

          {/* ฟอร์มเพิ่มทักษะใหม่ */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              + เพิ่มทักษะความชำนาญใหม่
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              เพิ่มทักษะที่ตนเองถนัด เพื่อให้ระบบนำไปจับคู่โปรเจกต์ที่เหมาะสม
            </p>

            <form onSubmit={handleAddSkill} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                {/* ช่องกรอกชื่อทักษะ พร้อม Datalist แนะนำ */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อทักษะ (Skill Name) *
                  </label>
                  <input
                    type="text"
                    list="skills-list"
                    value={newSkillName}
                    onChange={(e) => {
                      setNewSkillName(e.target.value);
                      setSkillError("");
                    }}
                    placeholder="เช่น React, Python, UI/UX..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <datalist id="skills-list">
                    {SKILL_OPTIONS.map((sk) => (
                      <option key={sk} value={sk} />
                    ))}
                  </datalist>
                </div>

                {/* เลือกระดับความเชี่ยวชาญ 20% - 100% */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ระดับความถนัด (%)
                  </label>
                  <select
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value={20}>20% (เริ่มต้น / พอรู้)</option>
                    <option value={40}>40% (ปานกลางระดับพื้นฐาน)</option>
                    <option value={60}>60% (ใช้งานได้คล่องแคล่ว)</option>
                    <option value={80}>80% (เชี่ยวชาญ / ทำงานจริงได้)</option>
                    <option value={100}>100% (ผู้เชี่ยวชาญขั้นสูง)</option>
                  </select>
                </div>
              </div>

              {/* ข้อความ Error เมื่อเพิ่มทักษะไม่ถูกต้อง */}
              {skillError && (
                <p className="text-xs text-red-500 font-medium">⚠️ {skillError}</p>
              )}

              <button
                type="submit"
                disabled={savingSkill}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingSkill ? "กำลังบันทึก..." : "+ บันทึกทักษะนี้"}
              </button>
            </form>
          </div>

          {/* รายการทักษะทั้งหมดของผู้ใช้พร้อมหลอด Progress Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                ทักษะที่บันทึกไว้ ({skills.length})
              </h2>
              <span className="text-xs text-slate-400">
                สามารถกดกากบาทเพื่อลบทักษะได้
              </span>
            </div>

            {skills.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                ยังไม่มีทักษะในรายการ กรุณาเพิ่มทักษะด้านบน
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {skills.map((skill) => (
                  <SkillBadge
                    key={skill.id}
                    skill={skill}
                    onDelete={handleDeleteSkill}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
