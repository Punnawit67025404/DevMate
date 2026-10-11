"use client";

// ==============================================================================
// app/auth/page.tsx
// โมดูลระบบยืนยันตัวตน (Nonpawit_login)
// ฟอร์ม เข้าสู่ระบบ / สมัครสมาชิก (@university.ac.th) ด้วย Supabase Auth (อีเมล + รหัสผ่าน)
// ==============================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../lib/supabase";

// หน้าที่จะพากลับไปหลังล็อกอิน (?next=/profile) — รับเฉพาะ path ภายในเว็บ กัน open redirect
function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/projects";
}

// แปลงข้อความ error ของ Supabase Auth เป็นภาษาไทยที่เข้าใจง่าย
function translateAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  if (message.includes("already registered")) return "อีเมลนี้สมัครสมาชิกไว้แล้ว กรุณาเข้าสู่ระบบ";
  if (message.includes("Email not confirmed")) return "ยังไม่ได้ยืนยันอีเมล กรุณาตรวจกล่องจดหมายของคุณ";
  return message;
}

export default function AuthPage() {
  const router = useRouter();
  
  // สลับแท็บระหว่าง 'login' หรือ 'register'
  const [mode, setMode] = useState<"login" | "register">("login");

  // ฟิลด์ข้อมูลฟอร์ม
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // การจัดการ Validation ข้อผิดพลาด
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ล็อกอิน/สมัครสมาชิกกับ Supabase Auth ด้วยอีเมลและรหัสผ่าน
  const authenticate = async (cleanEmail: string) => {
    const sb = getSupabase();
    if (!sb) {
      setErrorMessage("ยังไม่ได้ตั้งค่า Supabase — ใส่ค่าใน src/frontend/.env.local ก่อนใช้งาน");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) {
          setErrorMessage(translateAuthError(error.message));
          return;
        }
        router.push(nextPath());
        router.refresh();
        return;
      }

      const { data, error } = await sb.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { display_name: name.trim() } },
      });
      if (error) {
        setErrorMessage(translateAuthError(error.message));
        return;
      }

      if (data.session) {
        // ปิด Confirm email ไว้ จึงได้ session ทันที
        router.push(nextPath());
        router.refresh();
      } else {
        setInfoMessage("สมัครสมาชิกสำเร็จ! กรุณาตรวจอีเมลเพื่อยืนยันบัญชี แล้วกลับมาเข้าสู่ระบบ");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ตรวจสอบความถูกต้องของฟอร์มก่อนล็อกอิน/สมัครสมาชิก
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    const cleanEmail = email.trim().toLowerCase();

    // 1. ตรวจสอบโดเมนอีเมลมหาวิทยาลัย
    if (!cleanEmail.endsWith("@university.ac.th") && !cleanEmail.endsWith("@up.ac.th")) {
      setErrorMessage("กรุณาใช้อีเมลของมหาวิทยาลัย (@university.ac.th หรือ @up.ac.th)");
      return;
    }

    // 2. ตรวจสอบความยาวรหัสผ่าน >= 8 ตัวอักษร
    if (password.length < 8) {
      setErrorMessage("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }

    // 3. กรณีสมัครสมาชิก: ตรวจสอบการยืนยันรหัสผ่าน
    if (mode === "register" && password !== confirmPassword) {
      setErrorMessage("รหัสผ่านและช่องยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    void authenticate(cleanEmail);
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center py-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 sm:p-9 shadow-xl">
        
        {/* หัวข้อและโลโก้ */}
        <div className="text-center">
          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-100 mb-2">
            DevMate / Authentication
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {mode === "login" ? "เข้าสู่ระบบ DevMate" : "สมัครสมาชิกนิสิตใหม่"}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {mode === "login"
              ? "ยินดีต้อนรับกลับมา เข้าสู่ระบบเพื่อจัดการทีมและโปรเจกต์ของคุณ"
              : "สร้างบัญชีผู้ใช้ด้วยอีเมลมหาวิทยาลัยเพื่อเริ่มต้นจับคู่ทีม"}
          </p>
        </div>

        {/* แท็บสลับ เข้าสู่ระบบ / สมัครสมาชิก */}
        <div className="mt-6 flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => { setMode("login"); setErrorMessage(""); }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              mode === "login"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            เข้าสู่ระบบ (Login)
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setErrorMessage(""); }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              mode === "register"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            สมัครสมาชิก (Register)
          </button>
        </div>

        {/* ฟอร์มกรอกข้อมูล */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          
          {/* ช่องชื่อ (แสดงเฉพาะตอนสมัครสมาชิก) */}
          {mode === "register" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อ-นามสกุล หรือชื่อที่แสดง *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อ นามสกุล"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {/* ช่องอีเมลมหาวิทยาลัย */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              อีเมลมหาวิทยาลัย *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.ac.th"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              * ต้องลงท้ายด้วย <span className="font-semibold text-blue-600">@university.ac.th</span> หรือ <span className="font-semibold text-blue-600">@up.ac.th</span>
            </p>
          </div>

          {/* ช่องรหัสผ่าน */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              รหัสผ่าน (อย่างน้อย 8 ตัวอักษร) *
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* ช่องยืนยันรหัสผ่าน (เฉพาะตอนสมัครสมาชิก) */}
          {mode === "register" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ยืนยันรหัสผ่านอีกครั้ง *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {/* แสดงข้อความ Error ถ้ามี */}
          {errorMessage && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 font-medium">
              {errorMessage}
            </div>
          )}

          {infoMessage && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 font-medium">
              {infoMessage}
            </div>
          )}

          {/* ปุ่มส่งแบบฟอร์ม */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting
              ? "กำลังดำเนินการ..."
              : mode === "login"
              ? "เข้าสู่ระบบ"
              : "สร้างบัญชีใหม่"}
          </button>
        </form>
      </div>
    </div>
  );
}
