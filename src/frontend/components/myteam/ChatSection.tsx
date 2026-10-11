"use client";

// ==============================================================================
// components/myteam/ChatSection.tsx
// ห้องแชตกลุ่มทีม: โหลดประวัติจาก Supabase, ส่งข้อความลง DB และรับข้อความใหม่แบบ realtime
// (หน้าที่เรียกใช้ควรส่ง key={projectId} เพื่อให้รีเซ็ตเมื่อเปลี่ยนโปรเจกต์)
// ==============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchMessages,
  sendMessage,
  subscribeMessages,
  toChatMessage,
  type RawMessage,
} from "../../lib/db/messages";

interface ChatSectionProps {
  projectId: string;
  teamName: string;
  memberCount: number;
  meId: string;
  nameById: Record<string, string>;
}

export function ChatSection({ projectId, teamName, memberCount, meId, nameById }: ChatSectionProps) {
  const [rawMessages, setRawMessages] = useState<RawMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ข้อความของเราจะมาทั้งจากการส่งและจาก realtime จึงกันซ้ำด้วย id
  const addMessage = useCallback((message: RawMessage) => {
    setRawMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }, []);

  useEffect(() => {
    let live = true;
    let unsubscribe = () => {};

    try {
      // เริ่มฟังก่อนโหลดประวัติ เพื่อไม่ให้พลาดข้อความที่เข้ามาระหว่างโหลด
      unsubscribe = subscribeMessages(projectId, (message) => {
        if (live) addMessage(message);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "เชื่อมต่อแชตไม่สำเร็จ");
    }

    fetchMessages(projectId)
      .then((rows) => {
        if (!live) return;
        setRawMessages((prev) => {
          const ids = new Set(rows.map((r) => r.id));
          return [...rows, ...prev.filter((m) => !ids.has(m.id))];
        });
      })
      .catch((err: unknown) => {
        if (live) setError(err instanceof Error ? err.message : "โหลดข้อความไม่สำเร็จ");
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
      unsubscribe();
    };
  }, [projectId, addMessage]);

  // เลื่อนหน้าจอลงล่างสุดอัตโนมัติเมื่อมีข้อความใหม่
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rawMessages]);

  // ฟังก์ชันส่งข้อความ
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || sending) return;

    setSending(true);
    setError("");
    try {
      const saved = await sendMessage(projectId, inputMessage);
      addMessage(saved);
      setInputMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ส่งข้อความไม่สำเร็จ");
    } finally {
      setSending(false);
    }
  };

  const messages = rawMessages.map((m) => toChatMessage(m, meId, nameById));

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* ส่วนหัวของห้องแชต */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-3 w-3 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 text-sm truncate">{teamName} — Group Chat</h3>
            <p className="text-[11px] text-slate-500">สมาชิกในทีม {memberCount} คน</p>
          </div>
        </div>
      </div>

      {/* พื้นที่แสดงข้อความ (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-[360px] max-h-[500px] bg-slate-50/30">
        {loading && <p className="text-xs text-slate-400 text-center">กำลังโหลดข้อความ...</p>}
        {!loading && messages.length === 0 && !error && (
          <p className="text-xs text-slate-400 text-center pt-8">ยังไม่มีข้อความ เริ่มทักทายทีมได้เลย</p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}
          >
            {/* ชื่อผู้ส่ง (แสดงเฉพาะข้อความจากผู้อื่น) */}
            {!msg.isMe && (
              <span className="text-[11px] font-semibold text-slate-500 mb-1 ml-1">
                {msg.senderName}
              </span>
            )}

            {/* บับเบิลข้อความ Bubble */}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed ${
                msg.isMe
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
            </div>

            {/* เวลาส่งข้อความ */}
            <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* แถบพิมพ์และส่งข้อความ */}
      <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-3 bg-white flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          maxLength={2000}
          placeholder="พิมพ์ข้อความคุยกับทีม (กด Enter เพื่อส่ง)..."
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {sending ? "..." : "ส่ง"}
        </button>
      </form>
    </div>
  );
}
