import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

const WIB = "Asia/Jakarta";

export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateID(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: WIB,
  });
}

export function formatTimeWIB(date: Date = new Date()): string {
  return (
    new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: WIB,
    })
      .format(date)
      .replace(/\./g, ":") + " WIB"
  );
}

export function formatClockWIB(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: WIB,
  })
    .format(date)
    .replace(/\./g, ":");
}

export function todayWIB(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: WIB }).format(new Date());
}

export function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: localeId });
  } catch {
    return "";
  }
}

export function greeting(hour: number): string {
  if (hour < 4) return "Selamat malam";
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}
