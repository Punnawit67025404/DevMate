import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// หน้าที่ต้องล็อกอินก่อนเข้า (รวมหน้าย่อยด้านล่าง)
const PROTECTED_PATHS = ["/profile", "/myteam", "/matching", "/projects/create", "/members"];

// Next.js 15: refresh Supabase auth cookies for server and browser.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // ยังไม่ได้ตั้งค่า Supabase (ไม่มี .env.local): ข้ามการตรวจ session เพื่อไม่ให้ทุก request ล้ม
  // หน้าต่างๆ จะแสดงข้อความ "ยังไม่ได้ตั้งค่า Supabase" เองเมื่อพยายามดึงข้อมูล
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  // getUser validates the auth token and refreshes it when necessary.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ยังไม่ล็อกอินแต่เข้าหน้าที่ต้องล็อกอิน -> ส่งไป /auth พร้อมจำหน้าที่จะกลับมา
  const { pathname, search } = request.nextUrl;
  const needsLogin = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!user && needsLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return response;
}
