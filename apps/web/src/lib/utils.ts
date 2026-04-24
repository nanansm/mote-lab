import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Besok";
  if (diffDays === -1) return "Kemarin";
  if (diffDays > 0) return `${diffDays} hari lagi`;
  return `${Math.abs(diffDays)} hari lalu`;
}

// dd/MM/yyyy HH:mm WIB
export function formatDateTimeWIB(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(new Date(date)) + " WIB"
  );
}

export function formatDateTimeSecWIB(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(new Date(date)) + " WIB"
  );
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatIDR(num: number): string {
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(2)} M`;
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(2)} JT`;
  if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)} RB`;
  return `Rp ${Math.round(num).toLocaleString("id-ID")}`;
}

// Estimated omset: total_sold × price, amortised over 6-month assumption (same as extension)
export function estimateOmset(currentPrice: number | null, totalSold: number | null) {
  const total = (currentPrice ?? 0) * (totalSold ?? 0);
  return { total, monthly: total / 6 };
}
