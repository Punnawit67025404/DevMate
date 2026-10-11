"use client";

// ==============================================================================
// app/projects/[id]/page.tsx
// หน้ารายละเอียดโปรเจกต์ (US-06) + ปุ่มส่งใบสมัครเข้าร่วมทีม (US-07) + สถานะใบสมัคร (US-08)
// ==============================================================================

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { fetchProject } from "../../../lib/db/projects";
import { fetchMyProfile } from "../../../lib/db/profiles";
import { fetchMyApplication, applyToProject } from "../../../lib/db/applications";
import { getCurrentUserId } from "../../../lib/db/auth";
import { Application, Project } from "../../../types";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // แกะค่า params.id
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  // ลิงก์ผลงานที่แนบกับใบสมัคร: เริ่มต้นด้วย GitHub ในโปรไฟล์ของเรา
  const [portfolioLink, setPortfolioLink] = useState("");

  // โปรเจกต์ + ใบสมัครของเราจาก Supabase
  const [project, setProject] = useState<Project | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [loadedProject, myApplication, userId, me] = await Promise.all([
          fetchProject(projectId),
          fetchMyApplication(projectId),
          getCurrentUserId(),
          fetchMyProfile(),
        ]);
        if (!live) return;
        setPortfolioLink(me?.githubUrl ?? "");
        setProject(loadedProject);
        setApplication(myApplication);
        setIsOwner(!!loadedProject?.ownerId && loadedProject.ownerId === userId);
      } catch (err) {
        if (live) setLoadError(err instanceof Error ? err.message : "โหลดโปรเจกต์ไม่สำเร็จ");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [projectId]);

  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState("");

  // สเตต Modal ส่งใบสมัคร (US-07)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState(
    "สวัสดีครับ สนใจร่วมทีมทำโปรเจกต์นี้ครับ ผมมีทักษะตามที่กำหนดและพร้อมเริ่มงานทันทีครับ"
  );

  // ส่งใบสมัครเข้าร่วมทีม (US-07)
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !applyMessage.trim()) return;

    setSubmitting(true);
    setApplyError("");
    try {
      const created = await applyToProject({
        projectId: project.id,
        message: applyMessage,
        portfolioLink,
      });
      setApplication(created);
      setIsApplyModalOpen(false);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "ส่งใบสมัครไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  // ป้ายแสดงสถานะใบสมัคร (US-08)
  const renderStatusBadge = (status: Application["status"]) => {
    switch (status) {
      case "accepted":
        return (
          <span className="rounded-xl bg-emerald-100 border border-emerald-300 px-3.5 py-1.5 text-xs font-bold text-emerald-800">
            ✓ ได้รับการตอบรับเข้าทีมแล้ว (Accepted)
          </span>
        );
      case "rejected":
        return (
          <span className="rounded-xl bg-red-100 border border-red-300 px-3.5 py-1.5 text-xs font-bold text-red-800">
            ✗ ไม่ผ่านการคัดเลือก (Rejected)
          </span>
        );
      case "pending":
      default:
        return (
          <span className="rounded-xl bg-amber-100 border border-amber-300 px-3.5 py-1.5 text-xs font-bold text-amber-800">
            ⏳ รอเจ้าของโปรเจกต์พิจารณา (Pending)
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm text-xs text-slate-500">
        กำลังโหลดรายละเอียดโปรเจกต์...
      </div>
    );
  }

  if (loadError || !project) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <span className="text-4xl">📂</span>
        <h1 className="font-bold text-slate-900 text-base">
          {loadError ? "โหลดโปรเจกต์ไม่สำเร็จ" : "ไม่พบโปรเจกต์นี้"}
        </h1>
        {loadError && <p className="text-xs text-red-600">{loadError}</p>}
        <Link href="/projects" className="inline-block text-xs font-bold text-blue-600 hover:underline">
          ← กลับไปหน้ารวมโปรเจกต์ทั้งหมด
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* ปุ่มย้อนกลับ */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 transition"
        >
          ← กลับไปหน้ารวมโปรเจกต์ทั้งหมด
        </Link>
      </div>

      {/* แบนเนอร์หัวข้อโปรเจกต์ */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
              {project.category}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                project.status === "open"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {project.status === "open" ? "เปิดรับสมัครสมาชิก" : "ปิดรับสมัครแล้ว"}
            </span>
          </div>

          <span className="text-xs text-slate-400">
            สร้างเมื่อ: {project.createdAt}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
          {project.title}
        </h1>

        <div className="flex flex-wrap gap-4 text-xs text-slate-600 border-t border-slate-100 pt-3">
          <span>👑 เจ้าของโปรเจกต์: <strong className="text-slate-900">
              {project.ownerId ? (
                <Link href={`/members/${project.ownerId}`} className="hover:text-blue-600 hover:underline transition">
                  {project.ownerName}
                </Link>
              ) : (
                project.ownerName
              )}
            </strong></span>
          <span>⏱ ระยะเวลา: <strong className="text-slate-900">{project.duration}</strong></span>
          <span>👥 จำนวนสมาชิก: <strong className="text-blue-600">{project.currentMembers}/{project.maxMembers} คน</strong></span>
        </div>
      </div>

      {/* กล่องแสดงสถานะการสมัคร (US-08) หากเคยสมัครไว้แล้ว */}
      {application && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">
              สถานะใบสมัครของคุณ (US-08 Application Status):
            </span>
            {renderStatusBadge(application.status)}
          </div>
          <p className="text-xs text-slate-600">
            ข้อความที่คุณส่ง: "{application.message}"
          </p>
          <span className="text-[11px] text-slate-400">
            ส่งเมื่อ: {application.appliedAt}
          </span>
        </div>
      )}

      {/* เนื้อหารายละเอียดโปรเจกต์ (US-06) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* คอลัมน์ซ้าย: คำอธิบาย, Tech Stack, Milestones */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* รายละเอียดคำอธิบาย */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900">รายละเอียดโปรเจกต์ (US-06)</h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {project.description}
            </p>
          </div>

          {/* แผนงาน Milestones */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900">หมุดหมายสำคัญ (Milestones)</h2>
            <div className="space-y-2.5">
              {project.milestones.length === 0 && (
                <p className="text-xs text-slate-400">ผู้สร้างยังไม่ได้ระบุหมุดหมาย</p>
              )}
              {project.milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs"
                >
                  <span className="font-semibold text-slate-800">
                    {idx + 1}. {m.title}
                  </span>
                  <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-slate-600 font-bold">
                    {m.dueDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* คอลัมน์ขวา: ทักษะที่ต้องการ, Tech Stack, ปุ่ม Apply (US-07) */}
        <div className="space-y-6">
          
          {/* ทักษะที่ต้องการ */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900">ทักษะที่ต้องการ</h2>
            <div className="flex flex-wrap gap-1.5">
              {project.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900">Tech Stack ที่ใช้</h2>
            <div className="flex flex-wrap gap-1.5">
              {project.techStack.length === 0 && (
                <p className="text-xs text-slate-400">ผู้สร้างยังไม่ได้ระบุ Tech Stack</p>
              )}
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* ปุ่มส่งใบสมัคร (US-07) */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm text-center space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">สนใจเข้าร่วมทีมนี้?</h3>
            <p className="text-xs text-slate-600">
              กดส่งใบสมัครพร้อมแนบข้อความแนะนำตัวและลิงก์ผลงาน
            </p>

            {isOwner ? (
              <button
                disabled
                className="w-full rounded-xl bg-slate-200 py-3 text-xs font-bold text-slate-500 cursor-not-allowed"
              >
                👑 คุณเป็นเจ้าของโปรเจกต์นี้
              </button>
            ) : project.status !== "open" ? (
              <button
                disabled
                className="w-full rounded-xl bg-slate-200 py-3 text-xs font-bold text-slate-500 cursor-not-allowed"
              >
                🔒 โปรเจกต์ปิดรับสมัครแล้ว
              </button>
            ) : application ? (
              <button
                disabled
                className="w-full rounded-xl bg-slate-200 py-3 text-xs font-bold text-slate-500 cursor-not-allowed"
              >
                ✓ คุณได้ส่งใบสมัครแล้ว
              </button>
            ) : (
              <button
                onClick={() => setIsApplyModalOpen(true)}
                className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition"
              >
                📝 ส่งใบสมัครเข้าร่วมทีม (US-07)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Pop-up ส่งใบสมัคร (US-07 Apply Modal) */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-start pb-2 border-b">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  ส่งใบสมัครเข้าร่วมทีม (US-07)
                </h3>
                <p className="text-xs text-slate-500">
                  โปรเจกต์: <strong>{project.title}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ข้อความแนะนำตัวและเหตุผลที่อยากร่วมทีม *
                </label>
                <textarea
                  rows={4}
                  required
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="แนะนำตนเอง ทักษะที่ถนัด และความพร้อมในการร่วมทำโปรเจกต์..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  แนบลิงก์ผลงาน (GitHub / Behance / Portfolio)
                </label>
                <input
                  type="url"
                  value={portfolioLink}
                  onChange={(e) => setPortfolioLink(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {applyError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 font-medium">
                  ⚠️ {applyError}{" "}
                  {applyError.includes("เข้าสู่ระบบ") && (
                    <Link href="/auth" className="font-bold underline">
                      ไปหน้าเข้าสู่ระบบ
                    </Link>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "กำลังส่ง..." : "ยืนยันส่งใบสมัคร"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
