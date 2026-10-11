// ==============================================================================
// lib/db/avatars.ts
// รูปโปรไฟล์: ย่อรูปในเบราว์เซอร์ก่อน แล้วอัปโหลดตรงเข้า Supabase Storage (bucket "avatars")
// ไม่ผ่าน API ของ Next/Vercel จึงไม่ติดข้อจำกัดขนาด request
// path ที่เก็บ: <user_id>/avatar-<timestamp>.jpg (ชื่อใหม่ทุกครั้ง)
// ==============================================================================

import { requireSupabase } from "../supabase";
import { requireUserId } from "./auth";
import { AVATAR_BUCKET } from "./mappers";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SOURCE_BYTES = 8 * 1024 * 1024; // ไฟล์ต้นฉบับ (ก่อนย่อ)
const OUTPUT_SIZE = 512; // ย่อเป็นสี่เหลี่ยมจัตุรัส 512x512 (พอให้ดูรูปขยายได้คมและไฟล์ยังเล็ก)

// อายุแคชของ CDN (วินาที): สั้นพอที่รูปที่ผู้ใช้ลบจะหายจากลิงก์เก่าในเวลาไม่นาน
// (แคชยาวทำให้รูปที่ลบแล้วยังเปิดได้จากลิงก์เดิมนานมาก) ชื่อไฟล์ไม่ซ้ำทุกครั้ง จึงไม่ต้องกังวลรูปเก่าค้างตอนเปลี่ยนรูป
const CACHE_SECONDS = "600";

// ตรวจชนิดไฟล์ + ถอดรหัสรูปจริง (กันไฟล์อื่นที่แค่ตั้งชื่อ .jpg) ตัดกลางเป็นจัตุรัส ย่อ แล้วแปลงเป็น JPEG
// การวาดลง canvas ใหม่ทำให้ข้อมูล EXIF (เช่นพิกัด GPS) ไม่ถูกเก็บไปด้วย
export async function resizeImage(file: File): Promise<Blob> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("รองรับเฉพาะไฟล์รูป JPG, PNG หรือ WebP (รูป HEIC จาก iPhone ให้บันทึกเป็น JPG ก่อน)");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("ไฟล์ใหญ่เกิน 8 MB กรุณาเลือกรูปที่เล็กกว่านี้");
  }

  let bitmap: ImageBitmap;
  try {
    // from-image = หมุนรูปตามแนวที่ถ่ายมา (กันรูปจากมือถือตะแคง)
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("เปิดไฟล์รูปนี้ไม่ได้ (ไฟล์อาจเสียหรือไม่ใช่รูปจริง)");
  }

  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("เบราว์เซอร์นี้ประมวลผลรูปไม่ได้");

    // JPEG ไม่รองรับความโปร่งใส -> รองพื้นขาวให้ PNG ที่โปร่งใส
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) throw new Error("แปลงรูปไม่สำเร็จ");
    return blob;
  } finally {
    bitmap.close();
  }
}

function translateStorageError(message: string): string {
  if (/exceeded the maximum allowed size|too large|payload/i.test(message)) return "ไฟล์รูปใหญ่เกินกำหนด";
  if (/mime type|not supported/i.test(message)) return "ชนิดไฟล์ไม่รองรับ";
  if (/row-level security|unauthorized|not allowed/i.test(message)) return "ไม่มีสิทธิ์อัปโหลดรูปนี้";
  return message;
}

// อัปโหลดรูปใหม่ แล้วลบรูปเดิมทิ้ง คืน path ใหม่ (ใช้ avatarUrlOf เพื่อได้ URL)
export async function uploadAvatar(file: File): Promise<string> {
  const blob = await resizeImage(file);
  const sb = requireSupabase();
  const userId = await requireUserId("กรุณาเข้าสู่ระบบก่อนอัปโหลดรูป");

  const { data: current } = await sb.from("profiles").select("avatar_url").eq("id", userId).maybeSingle();
  const oldPath = (current?.avatar_url as string | undefined) || "";

  const path = `${userId}/avatar-${Date.now()}.jpg`;
  const { error: uploadError } = await sb.storage.from(AVATAR_BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    cacheControl: CACHE_SECONDS,
    upsert: false,
  });
  if (uploadError) throw new Error(translateStorageError(uploadError.message));

  const { error: saveError } = await sb.from("profiles").upsert({ id: userId, avatar_url: path }, { onConflict: "id" });
  if (saveError) {
    // บันทึกไม่สำเร็จ: เก็บกวาดไฟล์ที่เพิ่งอัปโหลด ไม่ให้ค้างเป็นไฟล์กำพร้า
    await sb.storage.from(AVATAR_BUCKET).remove([path]);
    throw new Error(saveError.message);
  }

  // ลบรูปเดิม (ถ้าลบไม่สำเร็จก็ไม่เป็นไร รูปใหม่ใช้งานได้แล้ว)
  if (oldPath && oldPath !== path) await sb.storage.from(AVATAR_BUCKET).remove([oldPath]);
  return path;
}

// ลบรูปโปรไฟล์ กลับไปใช้ตัวย่อชื่อ
export async function removeAvatar(): Promise<void> {
  const sb = requireSupabase();
  const userId = await requireUserId("กรุณาเข้าสู่ระบบก่อน");

  const { data: current } = await sb.from("profiles").select("avatar_url").eq("id", userId).maybeSingle();
  const oldPath = (current?.avatar_url as string | undefined) || "";
  if (!oldPath) return;

  const { error } = await sb.from("profiles").update({ avatar_url: "" }).eq("id", userId);
  if (error) throw new Error(error.message);
  await sb.storage.from(AVATAR_BUCKET).remove([oldPath]);
}
