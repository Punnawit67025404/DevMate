// ==============================================================================
// lib/db/messages.ts
// แชตของทีม (ตาราง messages) พร้อมรับข้อความใหม่แบบ realtime ผ่าน Supabase Realtime
// RLS: เฉพาะสมาชิกทีมอ่านและเขียนได้ (sender_id ต้องเป็นตัวเอง)
// ==============================================================================

import { requireSupabase } from "../supabase";
import type { ChatMessage } from "../../types";

export type RawMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string; // ISO
};

type DbMessage = { id: string; sender_id: string; body: string; created_at: string };

const toRaw = (row: DbMessage): RawMessage => ({
  id: row.id,
  senderId: row.sender_id,
  body: row.body,
  createdAt: row.created_at,
});

// ข้อความล่าสุดไม่เกิน 200 รายการ เรียงเก่า -> ใหม่
export async function fetchMessages(projectId: string): Promise<RawMessage[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return ((data ?? []) as DbMessage[]).map(toRaw).reverse();
}

export async function sendMessage(projectId: string, body: string): Promise<RawMessage> {
  const sb = requireSupabase();
  const text = body.trim();
  if (!text) throw new Error("กรุณาพิมพ์ข้อความ");
  if (text.length > 2000) throw new Error("ข้อความยาวเกิน 2,000 ตัวอักษร");

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("กรุณาเข้าสู่ระบบก่อนส่งข้อความ");

  const { data, error } = await sb
    .from("messages")
    .insert({ project_id: projectId, sender_id: user.id, body: text })
    .select("id, sender_id, body, created_at")
    .single();
  if (error) {
    if (error.code === "42501") throw new Error("ส่งข้อความไม่ได้ (คุณไม่ใช่สมาชิกของทีมนี้)");
    throw new Error(error.message);
  }
  return toRaw(data as DbMessage);
}

// รับข้อความใหม่ของโปรเจกต์นี้แบบ realtime คืนฟังก์ชันสำหรับเลิกติดตาม
export function subscribeMessages(projectId: string, onMessage: (message: RawMessage) => void): () => void {
  const sb = requireSupabase();
  const channel = sb
    .channel(`team-chat-${projectId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `project_id=eq.${projectId}` },
      (payload) => onMessage(toRaw(payload.new as DbMessage))
    )
    .subscribe();

  return () => {
    void sb.removeChannel(channel);
  };
}

// วันนี้แสดงเฉพาะเวลา; วันอื่นแสดงวันที่ + เวลา
export function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  const time = `${d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false })} น.`;
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? time : `${d.toLocaleDateString("th-TH", { day: "numeric", month: "short" })} ${time}`;
}

export function toChatMessage(message: RawMessage, meId: string, names: Record<string, string>): ChatMessage {
  return {
    id: message.id,
    senderId: message.senderId,
    senderName: names[message.senderId] || "ไม่ระบุชื่อ",
    text: message.body,
    time: formatMessageTime(message.createdAt),
    isMe: message.senderId === meId,
  };
}
