"use client";

// ==============================================================================
// components/Avatar.tsx
// วงกลมรูปโปรไฟล์: มีรูปใช้รูป (โหลดไม่ได้ก็ถอยกลับเป็นตัวย่อชื่อ) ไม่มีรูปใช้ตัวย่อชื่อ
// className กำหนดขนาด/รูปทรง/สี เหมือนที่แต่ละหน้าเคยใช้กับวงกลมตัวย่อ
// zoomable: คลิกรูปเพื่อดูแบบขยาย (กด Esc / คลิกพื้นหลัง / ปุ่ม ✕ เพื่อปิด)
//   ไม่ควรเปิดใน element ที่คลิกได้อยู่แล้ว (เช่นลิงก์) เพราะจะซ้อนกัน
// ==============================================================================

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { initialsOf } from "../lib/db/mappers";

interface AvatarProps {
  name: string;
  url?: string;
  className: string;
  zoomable?: boolean;
}

export function Avatar({ name, url, className, zoomable = false }: AvatarProps) {
  // จำ URL ที่โหลดไม่สำเร็จ ถ้าเปลี่ยนเป็น URL ใหม่จะลองโหลดอีกครั้ง
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const showImage = !!url && failedUrl !== url;
  const canZoom = zoomable && showImage;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const rootClass = `flex shrink-0 items-center justify-center overflow-hidden ${className}`;
  const content = showImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      loading="lazy"
      onError={() => setFailedUrl(url ?? null)}
      className="h-full w-full object-cover"
    />
  ) : (
    initialsOf(name)
  );

  return (
    <>
      {canZoom ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`ดูรูปโปรไฟล์ของ ${name}`}
          title="คลิกเพื่อดูรูปขยาย"
          className={`${rootClass} cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
        >
          {content}
        </button>
      ) : (
        <div className={rootClass}>{content}</div>
      )}

      {open &&
        canZoom &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`รูปโปรไฟล์ของ ${name}`}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-fadeIn"
          >
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={name}
                className="aspect-square w-[min(90vw,512px)] rounded-2xl bg-white object-cover shadow-2xl"
              />
              <p className="mt-3 text-center text-sm font-bold text-white">{name}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="ปิดรูป"
                className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700 shadow-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
