import { type NextRequest } from "next/server";
import { updateSession } from "./utils/supabase/middleware";

// Next.js 15 middleware (Next.js 16 uses proxy.ts instead).
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
