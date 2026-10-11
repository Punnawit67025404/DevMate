import { createClient } from "@/utils/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

// Compatibility adapter: existing 19 features still call getSupabase().
// Feature #13 Auth, #15 Projects, #20 Apply, #21 Review, etc.
let client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return null;
  if (!client) client = createClient();
  return client;
}

// ใช้ในฟังก์ชันดึง/บันทึกข้อมูล: ไม่มี fallback เป็นข้อมูลตัวอย่าง ถ้ายังไม่ตั้งค่า .env.local จะ error ชัดเจน
export function requireSupabase(): SupabaseClient {
  const sb = getSupabase();
  if (!sb) {
    throw new Error(
      "ยังไม่ได้ตั้งค่า Supabase — ใส่ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ใน src/frontend/.env.local"
    );
  }
  return sb;
}
