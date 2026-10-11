"use client";

// ==============================================================================
// components/Navbar.tsx
// แถบเมนูด้านบน (Navigation Bar) สำหรับนำทางไปยังโมดูลหลักต่างๆ ของ DevMate
// ==============================================================================

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import { getCurrentUser, type CurrentUser } from "../lib/db/auth";
import { Avatar } from "./Avatar";

// หน้าโปรไฟล์ส่งเหตุการณ์นี้เมื่อแก้ชื่อ/รูป เพื่อให้ Navbar โหลดข้อมูลผู้ใช้ใหม่ทันที (ไม่ต้องรีเฟรชหน้า)
export const PROFILE_UPDATED_EVENT = "devmate:profile-updated";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ผู้ใช้ที่ล็อกอินอยู่จริงจาก Supabase Auth (null = ยังไม่ล็อกอิน)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let live = true;
    const load = () => {
      getCurrentUser()
        .then((u) => {
          if (live) setCurrentUser(u);
        })
        .catch(() => {
          if (live) setCurrentUser(null);
        })
        .finally(() => {
          if (live) setAuthChecked(true);
        });
    };

    load();

    const sb = getSupabase();
    if (!sb) {
      return () => {
        live = false;
      };
    }

    // เรียก API ของ Supabase ใน callback โดยตรงอาจ deadlock จึงเลื่อนออกไปรอบถัดไป
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(() => {
      setTimeout(load, 0);
    });

    window.addEventListener(PROFILE_UPDATED_EVENT, load);

    return () => {
      live = false;
      subscription.unsubscribe();
      window.removeEventListener(PROFILE_UPDATED_EVENT, load);
    };
  }, []);

  const handleLogout = async () => {
    // ออกจากระบบเฉพาะเบราว์เซอร์นี้ (ค่าเริ่มต้น "global" จะเตะ session ของทุกอุปกรณ์ออกด้วย)
    await getSupabase()?.auth.signOut({ scope: "local" });
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  // รายการเมนูหลักในระบบ
  const navLinks = [
    { href: "/", label: "หน้าแรก" },
    { href: "/projects", label: "ค้นหาโปรเจกต์" },
    { href: "/matching", label: "ค้นหาสมาชิก" },
    { href: "/myteam", label: "เวิร์กสเปซทีม" },
    { href: "/profile", label: "โปรไฟล์และทักษะ" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        
        {/* โลโก้ DevMate */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-blue-600">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm font-extrabold text-base">
              DM
            </span>
            <span className="text-slate-900 font-extrabold">Dev<span className="text-blue-600">Mate</span></span>
          </Link>

          {/* เมนูสำหรับจอคอมพิวเตอร์ Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ปุ่มสร้างโปรเจกต์และโปรไฟล์ผู้ใช้ */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/projects/create"
            className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            + สร้างโปรเจกต์
          </Link>

          {authChecked && currentUser && (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 hover:bg-slate-100 transition"
              >
                <Avatar
                  name={currentUser.displayName}
                  url={currentUser.avatarUrl}
                  className="h-7 w-7 rounded-full bg-blue-600 text-xs font-bold text-white"
                />
                <span className="text-xs font-medium text-slate-700 max-w-[120px] truncate">
                  {currentUser.displayName}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-medium text-slate-500 hover:text-red-600 px-2 py-1"
              >
                ออกจากระบบ
              </button>
            </>
          )}

          {authChecked && !currentUser && (
            <Link
              href="/auth"
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </div>

        {/* ปุ่ม Hamburger เมนูสำหรับมือถือ */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Toggle Menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* เมนูเลื่อนลงมาบนมือถือ Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1 pb-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  pathname === link.href ? "bg-blue-50 text-blue-600 font-semibold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <Link
              href="/projects/create"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white shadow-sm"
            >
              + สร้างโปรเจกต์
            </Link>
            {authChecked && currentUser ? (
              <button
                type="button"
                onClick={handleLogout}
                className="text-center rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700"
              >
                ออกจากระบบ ({currentUser.displayName})
              </button>
            ) : (
              <Link
                href="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700"
              >
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
