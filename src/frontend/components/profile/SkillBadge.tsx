"use client";

// ==============================================================================
// components/profile/SkillBadge.tsx
// การ์ดแสดงทักษะ (Skill) พร้อมแถบ Progress Bar และปุ่มลบ
// ==============================================================================

import { Skill } from "../../types";

interface SkillBadgeProps {
  skill: Skill;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

export function SkillBadge({ skill, onDelete, readOnly = false }: SkillBadgeProps) {
  // กำหนดสีของหลอด Progress ตามระดับเปอร์เซ็นต์
  const getProgressColor = (level: number) => {
    if (level >= 80) return "bg-emerald-500";
    if (level >= 60) return "bg-blue-500";
    if (level >= 40) return "bg-amber-500";
    return "bg-slate-400";
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm text-slate-800">{skill.name}</span>
        
        <div className="flex items-center gap-2">
          {/* ป้ายแสดงระดับเปอร์เซ็นต์ */}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
            {skill.level}%
          </span>
          
          {/* ปุ่มลบแท็กทักษะ (แสดงเมื่อไม่ได้อยู่ในโหมดอ่านอย่างเดียว) */}
          {!readOnly && onDelete && (
            <button
              onClick={() => onDelete(skill.id)}
              className="text-slate-400 hover:text-red-500 transition p-0.5 rounded"
              title="ลบทักษะนี้"
              aria-label={`ลบทักษะ ${skill.name}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* หลอดความก้าวหน้า Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(skill.level)}`}
          style={{ width: `${skill.level}%` }}
        />
      </div>
    </div>
  );
}
