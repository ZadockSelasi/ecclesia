import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(date: any): string {
  if (!date) return "";
  try {
    if (typeof date.toDate === "function") {
      return formatDistanceToNow(date.toDate(), { addSuffix: true });
    }
    if (typeof date === "number" || typeof date === "string") {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    }
    if (date instanceof Date) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
  } catch (e) {
    return "";
  }
  return "";
}
