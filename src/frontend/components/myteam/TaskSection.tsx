"use client";

// ==============================================================================
// components/myteam/TaskSection.tsx
// งานของทีม: โหลด/เพิ่ม/สลับสถานะบันทึกลง Supabase (ตาราง tasks)
// (หน้าที่เรียกใช้ควรส่ง key={projectId} เพื่อให้รีเซ็ตเมื่อเปลี่ยนโปรเจกต์)
// ==============================================================================

import { useEffect, useRef, useState } from "react";
import { TeamTask } from "../../types";
import { createTask, fetchTasks, subscribeTasks, toUiTask, updateTaskStatus } from "../../lib/db/tasks";

interface TaskSectionProps {
  projectId: string;
  // สมาชิกทีมสำหรับเลือกผู้รับผิดชอบ
  members: { id: string; name: string }[];
}

const PRIORITY_LABEL: Record<TeamTask["priority"], string> = {
  high: "สูง",
  medium: "กลาง",
  low: "ต่ำ",
};

// pending -> in_progress -> completed -> pending
const NEXT_STATUS: Record<TeamTask["status"], TeamTask["status"]> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: "pending",
};

export function TaskSection({ projectId, members }: TaskSectionProps) {
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newPriority, setNewPriority] = useState<TeamTask["priority"]>("medium");
  const [newDueDate, setNewDueDate] = useState("");

  const names = Object.fromEntries(members.map((m) => [m.id, m.name]));

  // เก็บรายชื่อล่าสุดไว้ให้ callback ของ realtime ใช้ โดยไม่ต้องโหลดงานใหม่ทุกครั้งที่สมาชิกเปลี่ยน
  const namesRef = useRef(names);
  useEffect(() => {
    namesRef.current = names;
  });

  // เพิ่มงานใหม่ หรือแทนที่งานเดิม (กันซ้ำด้วย id เพราะงานที่เราเพิ่มเองก็จะวิ่งกลับมาทาง realtime)
  const upsertTask = (task: TeamTask) =>
    setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev]));

  useEffect(() => {
    let live = true;
    let unsubscribe = () => {};

    try {
      // เริ่มฟังก่อนโหลด เพื่อไม่ให้พลาดงานที่เปลี่ยนระหว่างโหลด
      unsubscribe = subscribeTasks(projectId, (row) => {
        if (live) upsertTask(toUiTask(row, namesRef.current));
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "เชื่อมต่อการอัปเดตงานสดไม่สำเร็จ");
    }

    fetchTasks(projectId, namesRef.current)
      .then((rows) => {
        if (!live) return;
        // รวมกับงานที่เข้ามาทาง realtime ระหว่างโหลด (ใช้ข้อมูลจาก DB เป็นหลัก)
        setTasks((prev) => {
          const ids = new Set(rows.map((r) => r.id));
          return [...rows, ...prev.filter((t) => !ids.has(t.id))];
        });
      })
      .catch((err: unknown) => {
        if (live) setError(err instanceof Error ? err.message : "โหลดงานไม่สำเร็จ");
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ป้ายแสดงสถานะพร้อมสีตามเงื่อนไข
  const renderStatusBadge = (status: TeamTask["status"]) => {
    switch (status) {
      case "completed":
        return (
          <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            ✓ เสร็จสิ้น
          </span>
        );
      case "in_progress":
        return (
          <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
            ⏳ กำลังทำ
          </span>
        );
      case "pending":
      default:
        return (
          <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            🕒 รอดำเนินการ
          </span>
        );
    }
  };

  // สลับสถานะ Task เมื่อกดคลิก (อัปเดตหน้าทันที แล้วบันทึกลง DB; ล้มเหลวให้ย้อนกลับ)
  const toggleTaskStatus = async (task: TeamTask) => {
    const next = NEXT_STATUS[task.status];
    setError("");
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    try {
      await updateTaskStatus(task.id, next);
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
      setError(err instanceof Error ? err.message : "บันทึกสถานะไม่สำเร็จ");
    }
  };

  // เพิ่ม Task งานใหม่
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || adding) return;

    setAdding(true);
    setError("");
    try {
      const created = await createTask(
        {
          projectId,
          title: newTitle,
          assigneeId: newAssignee || null,
          priority: newPriority,
          dueDate: newDueDate || null,
        },
        names
      );
      upsertTask(created);
      setNewTitle("");
      setNewDueDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เพิ่มงานไม่สำเร็จ");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">งานของทีม</h3>
          <p className="text-xs text-slate-500">คลิกที่การ์ดงานเพื่อสลับสถานะ</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
          {tasks.filter((t) => t.status === "completed").length}/{tasks.length} เสร็จแล้ว
        </span>
      </div>

      {/* ฟอร์มเพิ่มงานใหม่ */}
      <form onSubmit={handleAddTask} className="mt-3.5 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="+ เพิ่มงานใหม่..."
            className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={adding}
            className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {adding ? "..." : "เพิ่ม"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <select
            value={newAssignee}
            onChange={(e) => setNewAssignee(e.target.value)}
            aria-label="ผู้รับผิดชอบ"
            className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="">ยังไม่มอบหมาย</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as TeamTask["priority"])}
            aria-label="ความสำคัญ"
            className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="high">สำคัญ: สูง</option>
            <option value="medium">สำคัญ: กลาง</option>
            <option value="low">สำคัญ: ต่ำ</option>
          </select>
          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            aria-label="กำหนดส่ง"
            className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
          />
        </div>
      </form>

      {error && <p className="mt-2 text-xs text-red-500 font-medium">⚠️ {error}</p>}

      {/* รายการงาน Tasks */}
      <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto">
        {loading && <p className="text-xs text-slate-400 text-center">กำลังโหลดงาน...</p>}
        {!loading && tasks.length === 0 && !error && (
          <p className="text-xs text-slate-400 text-center py-4">ยังไม่มีงาน เพิ่มงานแรกของทีมได้เลย</p>
        )}

        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTaskStatus(task)}
            className="flex cursor-pointer flex-col gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition hover:bg-slate-50 hover:border-slate-300 active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={`text-xs font-bold ${
                  task.status === "completed"
                    ? "line-through text-slate-400"
                    : "text-slate-800"
                }`}
              >
                {task.title}
              </span>
              {renderStatusBadge(task.status)}
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
              <span className="truncate">
                👤{" "}
                <strong className="text-slate-700">
                  {task.assigneeId ? names[task.assigneeId] || task.assignee : task.assignee}
                </strong>
              </span>
              <span className="shrink-0">
                ⚑ {PRIORITY_LABEL[task.priority]} · 📅 {task.dueDate}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
