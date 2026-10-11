"use client";

// ==============================================================================
// app/projects/create/page.tsx
// หน้าสร้างโพสต์โปรเจกต์ 3 ขั้นตอน (US-01: โพสต์โปรเจกต์, US-02: กำหนดความต้องการ)
// Step 1: ข้อมูลทั่วไป | Step 2: ระยะเวลา & Timeline | Step 3: ทักษะที่ต้องการ (> 1 รายการ)
// ==============================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SKILL_OPTIONS } from "../../../lib/skills";
import { createProject } from "../../../lib/db/projects";

export default function CreateProjectPage() {
  const router = useRouter();

  // สเตตขั้นตอนปัจจุบัน 1, 2, 3
  const [currentStep, setCurrentStep] = useState<number>(1);

  // ฟิลด์ข้อมูล Step 1: ข้อมูลทั่วไป
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Web");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);

  // ฟิลด์ข้อมูล Step 2: ระยะเวลาและ Timeline
  const [duration, setDuration] = useState("1 ภาคการศึกษา (4 เดือน)");
  const [timeline, setTimeline] = useState("");
  const [milestones, setMilestones] = useState<{ title: string; dueDate: string }[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDate, setNewMilestoneDate] = useState("");

  // ฟิลด์ข้อมูล Step 3: ทักษะที่ต้องการ
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");

  // ข้อความแจ้งเตือนข้อผิดพลาด
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ฟังก์ชันสลับเลือก Skill
  const toggleSkill = (skill: string) => {
    if (requiredSkills.includes(skill)) {
      setRequiredSkills(requiredSkills.filter((s) => s !== skill));
    } else {
      setRequiredSkills([...requiredSkills, skill]);
    }
    setErrorMessage("");
  };

  // เพิ่ม Skill แบบกำหนดเอง
  const addCustomSkill = () => {
    if (!customSkill.trim()) return;
    if (requiredSkills.includes(customSkill.trim())) {
      setErrorMessage("ทักษะนี้มีอยู่ในรายการแล้ว");
      return;
    }
    setRequiredSkills([...requiredSkills, customSkill.trim()]);
    setCustomSkill("");
    setErrorMessage("");
  };

  // เพิ่ม Milestone ในขั้นตอนที่ 2
  const addMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    setMilestones([
      ...milestones,
      { title: newMilestoneTitle.trim(), dueDate: newMilestoneDate || "เร็วๆ นี้" },
    ]);
    setNewMilestoneTitle("");
    setNewMilestoneDate("");
  };

  // ลบ Milestone
  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  // ตรวจสอบความถูกต้องและไปขั้นตอนถัดไป
  const handleNextStep = () => {
    setErrorMessage("");

    if (currentStep === 1) {
      if (!title.trim()) {
        setErrorMessage("กรุณาระบุชื่อโปรเจกต์");
        return;
      }
      if (!description.trim() || description.length < 20) {
        setErrorMessage("กรุณาระบุคำอธิบายโปรเจกต์อย่างน้อย 20 ตัวอักษร");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!duration.trim()) {
        setErrorMessage("กรุณาระบุระยะเวลาดำเนินงาน");
        return;
      }
      setCurrentStep(3);
    }
  };

  // ยืนยันการสร้างโปรเจกต์ (Step 3 Submit)
  const handleSubmitProject = async () => {
    setErrorMessage("");

    // เงื่อนไข: ต้องมีทักษะที่ต้องการมากกว่า 1 รายการ (> 1 รายการ)
    if (requiredSkills.length <= 1) {
      setErrorMessage("กรุณากำหนดทักษะที่ต้องการอย่างน้อย 2 รายการขึ้นไป (> 1 รายการ)");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createProject({
        title,
        description,
        category,
        duration,
        timeline,
        milestones,
        requiredSkills,
        maxMembers,
      });

      router.push(`/projects/${created.id}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "สร้างโปรเจกต์ไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      
      {/* ส่วนหัวหน้า */}
      <div className="text-center space-y-2">
        <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-100">
          US-01 & US-02: Project Creation Wizard
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          สร้างโพสต์โปรเจกต์ใหม่ (3 ขั้นตอน)
        </h1>
        <p className="text-xs text-slate-500">
          กรอกรายละเอียดโปรเจกต์เพื่อเปิดรับสมัครเพื่อนร่วมทีมนิสิต
        </p>
      </div>

      {/* แถบความคืบหน้า 3 ขั้นตอน Stepper */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          
          {/* Step 1 Indicator */}
          <div
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition ${
              currentStep === 1
                ? "bg-blue-50 text-blue-700 font-bold"
                : currentStep > 1
                ? "text-emerald-600 font-semibold"
                : "text-slate-400"
            }`}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                currentStep === 1
                  ? "bg-blue-600 text-white"
                  : currentStep > 1
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {currentStep > 1 ? "✓" : "1"}
            </div>
            <span>1. ข้อมูลทั่วไป</span>
          </div>

          {/* Step 2 Indicator */}
          <div
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition ${
              currentStep === 2
                ? "bg-blue-50 text-blue-700 font-bold"
                : currentStep > 2
                ? "text-emerald-600 font-semibold"
                : "text-slate-400"
            }`}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                currentStep === 2
                  ? "bg-blue-600 text-white"
                  : currentStep > 2
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {currentStep > 2 ? "✓" : "2"}
            </div>
            <span>2. ระยะเวลา & แผนงาน</span>
          </div>

          {/* Step 3 Indicator */}
          <div
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition ${
              currentStep === 3
                ? "bg-blue-50 text-blue-700 font-bold"
                : "text-slate-400"
            }`}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                currentStep === 3
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              3
            </div>
            <span>3. ทักษะที่ต้องการ (&gt; 1)</span>
          </div>
        </div>
      </div>

      {/* กล่องแบบฟอร์มตามขั้นตอนปัจจุบัน */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* ============================================================== */}
        {/* STEP 1: ข้อมูลทั่วไป (Title, Category, Description, MaxMembers) */}
        {/* ============================================================== */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2">
              ขั้นตอนที่ 1: ข้อมูลพื้นฐานของโปรเจกต์
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อโปรเจกต์ (Project Title) *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น DevMate — แพลตฟอร์มจับคู่เพื่อนร่วมทีม"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หมวดหมู่โปรเจกต์ *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="Web">Web Application</option>
                  <option value="Mobile">Mobile Application</option>
                  <option value="AI/ML">AI / Machine Learning</option>
                  <option value="IoT">IoT & Hardware</option>
                  <option value="Game">Game Development</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  จำนวนสมาชิกรวมที่ต้องการ (คน) *
                </label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                คำอธิบายโปรเจกต์และเป้าหมาย (อย่างน้อย 20 ตัวอักษร) *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="อธิบายว่าโปรเจกต์นี้ทำเกี่ยวกับอะไร ใช้ส่งวิชาไหน และกำลังมองหาเพื่อนร่วมทีมแบบใด..."
                className="w-full rounded-xl border border-slate-300 p-3.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: ระยะเวลา & Timeline (Duration, Milestones) */}
        {/* ============================================================== */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2">
              ขั้นตอนที่ 2: กำหนดระยะเวลาและหมุดหมายแผนงาน (Timeline & Milestones)
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ระยะเวลาดำเนินงานโดยประมาณ *
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                <option value="1-2 เดือน (งานด่วน/สั้น)">1-2 เดือน (งานด่วน/สั้น)</option>
                <option value="1 ภาคการศึกษา (4 เดือน)">1 ภาคการศึกษา (4 เดือน - แนะนำสำหรับวิชาโปรเจกต์)</option>
                <option value="6 เดือนขึ้นไป (Senior Project)">6 เดือนขึ้นไป (Senior Project / วิจัย)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                สรุปภาพรวม Timeline แผนงาน (ถ้ามี)
              </label>
              <input
                type="text"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="เช่น เดือนที่ 1 ออกแบบ UI, เดือนที่ 2 พัฒนา Frontend, เดือนที่ 3 รวมระบบ"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* เพิ่ม Milestones */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700">
                หมุดหมายสำคัญของโปรเจกต์ (Milestones):
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  placeholder="ชื่องานสำคัญ เช่น ส่ง Final Presentation"
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
                <input
                  type="text"
                  value={newMilestoneDate}
                  onChange={(e) => setNewMilestoneDate(e.target.value)}
                  placeholder="กำหนดส่ง เช่น สัปดาห์ที่ 14"
                  className="w-36 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addMilestone}
                  className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
                >
                  + เพิ่ม
                </button>
              </div>

              {/* รายการ Milestones */}
              <div className="space-y-2 mt-2">
                {milestones.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs"
                  >
                    <span>
                      📌 <strong>{m.title}</strong> — <span className="text-slate-500">{m.dueDate}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMilestone(idx)}
                      className="text-red-500 hover:underline font-bold"
                    >
                      ลบ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: ทักษะที่ต้องการ (> 1 รายการ) (Required Skills) */}
        {/* ============================================================== */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2">
              ขั้นตอนที่ 3: กำหนดทักษะที่ต้องการในโปรเจกต์ (&gt; 1 รายการ)
            </h2>

            <p className="text-xs text-slate-500">
              เลือกทักษะที่สมาชิกต้องมีเพื่อช่วยคำนวณ Match Score (ต้องเลือกอย่างน้อย 2 ทักษะ)
            </p>

            {/* ชิปทักษะแนะนำ */}
            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">คลิกเพื่อเลือกทักษะแนะนำ:</p>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => {
                  const isSelected = requiredSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {isSelected ? `✓ ${skill}` : `+ ${skill}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* เพิ่มทักษะเองถ้าไม่มีในรายการ */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                placeholder="พิมพ์ทักษะอื่นๆ เช่น PyTorch, Kubernetes..."
                className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={addCustomSkill}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                + เพิ่มทักษะนี้
              </button>
            </div>

            {/* สรุปทักษะที่เลือกแล้ว */}
            <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-blue-900">
                  ทักษะที่เลือกไว้ ({requiredSkills.length} รายการ):
                </span>
                <span className="text-blue-700 font-semibold">
                  {requiredSkills.length > 1 ? "✓ ครบตามเกณฑ์ (> 1 รายการ)" : "⚠️ ต้องการอย่างน้อย 2 รายการ"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {requiredSkills.map((s) => (
                  <span
                    key={s}
                    onClick={() => toggleSkill(s)}
                    className="cursor-pointer rounded-lg bg-white border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                    title="คลิกเพื่อลบออก"
                  >
                    {s} ✕
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ข้อความแจ้งเตือน Error */}
        {errorMessage && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 font-medium">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* ปุ่มนำทางขั้นตอน ย้อนกลับ / ถัดไป / ยืนยัน */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => { setCurrentStep(currentStep - 1); setErrorMessage(""); }}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              ← ย้อนกลับ
            </button>
          ) : (
            <Link
              href="/projects"
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ยกเลิก
            </Link>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition"
            >
              ขั้นตอนถัดไป →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitProject}
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-7 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "กำลังบันทึก..." : "🚀 ยืนยันสร้างโปรเจกต์ (Publish)"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
