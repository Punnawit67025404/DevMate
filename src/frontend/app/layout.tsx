import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import { Navbar } from "../components/Navbar";

// ==============================================================================
// app/layout.tsx
// Root Layout ของระบบ DevMate — โหลด Tailwind CSS, Navbar และครอบโครงสร้างหน้าเว็บทั้งหมด
// ==============================================================================

export const metadata: Metadata = {
  title: "DevMate — เครื่องมือหาเพื่อนร่วมทีมทำโปรเจกต์สำหรับนิสิต",
  description: "แพลตฟอร์มจับคู่หาเพื่อนร่วมทีมทำโปรเจกต์ของนิสิตมหาวิทยาลัยตามทักษะความสามารถ (Tools for Modern Learners)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
        {/* แถบเมนูด้านบน */}
        <Navbar />

        {/* เนื้อหาหลักของแต่ละหน้า */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>

        {/* Footer ด้านล่าง */}
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-7xl px-4">
            <p>© 2026 DevMate — Tools for Modern Learners (Software Engineering Project)</p>
            <p className="mt-1 text-slate-400">สำหรับนิสิตมหาวิทยาลัยเพื่อสร้างสรรค์นวัตกรรมร่วมกัน</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
