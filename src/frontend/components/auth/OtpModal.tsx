"use client";

// ==============================================================================
// components/auth/OtpModal.tsx
// Modal Pop-up สำหรับกรอกรหัสยืนยัน OTP 6 หลัก (Auto-focus เลื่อนช่องอัตโนมัติ)
// ==============================================================================

import { useState, useRef, useEffect } from "react";

interface OtpModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onVerifySuccess: () => void;
}

export function OtpModal({ isOpen, email, onClose, onVerifySuccess }: OtpModalProps) {
  // สเตตเก็บค่าตัวเลข 6 ช่อง
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Ref อ้างอิงแต่ละ Input ทั้ง 6 ช่อง เพื่อสั่ง Focus
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // โฟกัสไปที่ช่องแรกเมื่อเปิด Modal
  useEffect(() => {
    if (isOpen) {
      setOtp(["", "", "", "", "", ""]);
      setErrorMessage("");
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // จัดการเมื่อพิมพ์ตัวเลขลงในช่อง
  const handleChange = (index: number, value: string) => {
    // รับเฉพาะตัวเลข 0-9
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    // ถ้าพิมพ์มากกว่า 1 ตัว (เช่น พิมพ์ทับ) ให้เอาตัวสุดท้าย
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setErrorMessage("");

    // ถ้ากรอกแล้วมีค่า ให้เลื่อนเคอร์เซอร์ไปช่องถัดไปอัตโนมัติ
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // จัดการเมื่อกดปุ่ม Backspace เพื่อถอยไปช่องก่อนหน้า
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // รองรับการ Copy & Paste ตัวเลข 6 หลักรวดเดียว
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  // กดยืนยัน OTP
  const handleSubmit = () => {
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setErrorMessage("กรุณากรอกรหัส OTP ให้ครบ 6 หลัก");
      return;
    }

    setIsVerifying(true);
    // จำลองการตรวจสอบรหัส OTP (Mock Verify)
    setTimeout(() => {
      setIsVerifying(false);
      // สำหรับการทดสอบ: รับรหัสผ่านทุกแบบ หรือกำหนดรหัสตัวอย่าง "123456"
      onVerifySuccess();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100">
        
        {/* หัวข้อ Modal */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900">ยืนยันรหัส OTP</h3>
          <p className="mt-2 text-sm text-slate-500">
            ระบบจำลองได้ส่งรหัส 6 หลักไปยังอีเมล <br />
            <span className="font-semibold text-slate-800">{email}</span>
          </p>
          <p className="text-xs text-blue-600 mt-1 font-medium bg-blue-50 py-1 px-3 rounded-full inline-block">
            (สำหรับโหมดเดโม: กรอกรหัสใดๆ เช่น 123456)
          </p>
        </div>

        {/* ช่องกรอก OTP 6 ช่อง */}
        <div className="mt-6 flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="h-12 w-11 sm:h-14 sm:w-12 rounded-xl border border-slate-300 text-center text-xl font-bold text-slate-900 shadow-sm transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          ))}
        </div>

        {/* ข้อความแจ้งเตือน Error */}
        {errorMessage && (
          <p className="mt-3 text-center text-xs font-medium text-red-500">{errorMessage}</p>
        )}

        {/* ปุ่มกดยืนยัน / ยกเลิก */}
        <div className="mt-7 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isVerifying}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 active:scale-[0.99] transition disabled:opacity-50"
          >
            {isVerifying ? "กำลังตรวจสอบรหัส..." : "ยืนยันรหัส OTP"}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            ยกเลิก
          </button>
        </div>

        {/* ส่งรหัสใหม่อีกครั้ง */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => alert("ส่งรหัส OTP รอบใหม่ไปยังอีเมลของคุณเรียบร้อยแล้ว")}
            className="text-xs text-slate-500 hover:text-blue-600 font-medium"
          >
            ไม่ได้รับรหัส? <span className="underline">ส่งรหัสอีกครั้ง</span>
          </button>
        </div>
      </div>
    </div>
  );
}
