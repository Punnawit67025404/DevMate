// ==============================================================================
// lib/db/tasks.ts
// งานของทีม (ตาราง tasks; RLS ให้สมาชิกทีมอ่าน/เพิ่ม/แก้ไขได้)
// ==============================================================================

import { requireSupabase } from "../supabase";
import { formatThaiDate } from "./mappers";
import type { TeamTask } from "../../types";

export type DbTask = {
  id: string;
  title: string;
  status: string;
  priority?: string;
  assignee_id?: string | null;
  due_date?: string | null;
};

// DB ใช้ todo/in_progress/done ส่วน UI ใช้ pending/in_progress/completed
const FROM_DB: Record<string, TeamTask["status"]> = {
  todo: "pending",
  in_progress: "in_progress",
  done: "completed",
};
const TO_DB: Record<TeamTask["status"], string> = {
  pending: "todo",
  in_progress: "in_progress",
  completed: "done",
};

export function toUiTask(row: DbTask, names: Record<string, string>): TeamTask {
  return {
    id: row.id,
    title: row.title,
    assignee: row.assignee_id ? names[row.assignee_id] || "ไม่ระบุชื่อ" : "ยังไม่มอบหมาย",
    assigneeId: row.assignee_id ?? undefined,
    status: FROM_DB[row.status] ?? "pending",
    priority: row.priority === "high" || row.priority === "low" ? row.priority : "medium",
    dueDate: row.due_date ? formatThaiDate(row.due_date) : "ไม่กำหนด",
  };
}

export async function fetchTasks(projectId: string, names: Record<string, string>): Promise<TeamTask[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as DbTask[]).map((row) => toUiTask(row, names));
}

export async function createTask(
  input: {
    projectId: string;
    title: string;
    assigneeId: string | null;
    priority: TeamTask["priority"];
    dueDate: string | null; // รูปแบบ yyyy-mm-dd
  },
  names: Record<string, string>
): Promise<TeamTask> {
  const sb = requireSupabase();
  const title = input.title.trim();
  if (!title) throw new Error("กรุณาระบุชื่องาน");

  const { data, error } = await sb
    .from("tasks")
    .insert({
      project_id: input.projectId,
      title,
      assignee_id: input.assigneeId,
      priority: input.priority,
      due_date: input.dueDate,
      status: "todo",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return toUiTask(data as DbTask, names);
}

// รับงานที่ถูกเพิ่ม/แก้ไขโดยสมาชิกคนอื่นแบบ realtime (RLS ส่งให้เฉพาะสมาชิกทีม) คืนฟังก์ชันเลิกติดตาม
export function subscribeTasks(projectId: string, onChange: (task: DbTask) => void): () => void {
  const sb = requireSupabase();
  const channel = sb
    .channel(`team-tasks-${projectId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` },
      (payload) => {
        if (payload.eventType === "DELETE") return;
        onChange(payload.new as DbTask);
      }
    )
    .subscribe();

  return () => {
    void sb.removeChannel(channel);
  };
}

export async function updateTaskStatus(taskId: string, status: TeamTask["status"]): Promise<void> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("tasks")
    .update({ status: TO_DB[status] })
    .eq("id", taskId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("ไม่สามารถแก้ไขงานนี้ได้ (คุณอาจไม่ใช่สมาชิกของทีม)");
}
