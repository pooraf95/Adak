import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// تبدیل اعداد به فرمت ۳ رقم ۳ رقم به همراه واحد تومان
export function formatToman(amount: number | string | undefined | null): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return "۰ تومان";
  const num = Math.round(Number(amount));
  return num.toLocaleString("fa-IR") + " تومان";
}

// فرمت فقط عدد با جداکننده هزارگان و ارقام فارسی
export function formatNumber(num: number | string | undefined | null): string {
  if (num === null || num === undefined || isNaN(Number(num))) return "۰";
  return Math.round(Number(num)).toLocaleString("fa-IR");
}

// تبدیل اعداد انگلیسی به فارسی
export function toPersianDigits(str: string | number): string {
  if (str === null || str === undefined) return "";
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str
    .toString()
    .replace(/[0-9]/g, (w) => farsiDigits[+w]);
}

// تبدیل ارقام فارسی یا رشته به عدد انگلیسی معتبر
export function parsePersianNumber(str: string): number {
  if (!str) return 0;
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  let clean = str.toString().replace(/,/g, '').replace(/،/g, '').trim();
  for (let i = 0; i < 10; i++) {
    clean = clean.replace(persianDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
  }
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// فرمت تاریخ و ساعت شمسی
export function formatShamsiDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "";
  }
}

// فقط روز و ماه شمسی
export function formatShamsiShort(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}
