import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const timeUnits: [number, string][] = [
    [days, 'day'],
    [hours % 24, 'hour'],
    [minutes % 60, 'minute'],
    [seconds % 60, 'second']
  ];

  const result = timeUnits
    .filter(([value]) => value > 0)
    .slice(0, 2)
    .map(([value, unit]) => `${value} ${unit}${value !== 1 ? 's' : ''}`)
    .join(' ');

  return result || '0 seconds';
}

