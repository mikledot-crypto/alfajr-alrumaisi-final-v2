import { supabase } from "@/integrations/supabase/client";

export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآا]/g, "ا")
    .replace(/[ى]/g, "ي")
    .replace(/[ؤ]/g, "و")
    .replace(/[ئ]/g, "ي")
    .replace(/[ة]/g, "ه")
    
    .replace(/[\s_]+/g, "-")
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || `post-${Date.now()}`;
}

export function formatArabicDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function stripHtml(html: string): string {
  return (html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function makeExcerpt(htmlOrText: string, maxLength = 220): string {
  const text = stripHtml(htmlOrText);
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength).replace(/\s+\S*$/, "").trim();
  return `${cut}…`;
}

export function estimateReadingMinutes(html: string): number {
  const text = stripHtml(html);
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

export function authorInitials(nameOrEmail?: string | null): string {
  const value = (nameOrEmail || "معتز العلقمي").trim();
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
  return value.slice(0, 2);
}

export function isMissingColumnError(error: unknown): boolean {
  const message = typeof error === "object" && error && "message" in error
    ? String((error as { message?: unknown }).message ?? "")
    : String(error ?? "");
  return /schema cache|column|does not exist|could not find/i.test(message);
}

export async function uploadMediaFile(file: File, folder = "covers"): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("يرجى اختيار ملف صورة فقط.");
  }
  if (file.size > 6 * 1024 * 1024) {
    throw new Error("حجم الصورة يجب ألا يتجاوز 6MB.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${folder}/${new Date().getFullYear()}/${crypto.randomUUID()}.${safeExt}`;

  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });

  if (error) {
    throw new Error(`${error.message}. تأكد من إنشاء bucket باسم media وتشغيل migration الخاص بالـ Storage.`);
  }

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}
