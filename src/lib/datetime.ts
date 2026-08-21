import { format, isSameDay, startOfDay, endOfDay, addDays, addMinutes, differenceInMinutes, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export { startOfDay, endOfDay, addDays, addMinutes, isSameDay, differenceInMinutes, differenceInCalendarDays };

/** "HH:mm" -> minutos desde a meia-noite. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map((n) => Number.parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/** Minutos desde a meia-noite -> "HH:mm". */
export function minutesToTime(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60) % 24;
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Combina uma data com um horário "HH:mm" no fuso local do servidor. */
export function atTime(date: Date, time: string): Date {
  const d = new Date(date);
  const [h, m] = time.split(':').map((n) => Number.parseInt(n, 10));
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Interseção estrita de intervalos — encostar não é conflito. */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** "2026-08-20" -> Date local (evita o deslocamento UTC do construtor nativo). */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map((n) => Number.parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

export function formatDateLong(date: Date): string {
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatDateMedium(date: Date): string {
  return format(date, "d 'de' MMM", { locale: ptBR });
}

export function formatWeekdayShort(date: Date): string {
  return format(date, 'EEE', { locale: ptBR }).replace('.', '');
}

export function formatWeekdayLong(date: Date): string {
  return format(date, 'EEEE', { locale: ptBR });
}

export function formatDateTime(date: Date): string {
  return `${formatDateMedium(date)} às ${formatTime(date)}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

/** Rótulo humano para datas próximas: "Hoje", "Amanhã", "sáb, 23 de ago". */
export function formatRelativeDay(date: Date, reference = new Date()): string {
  const diff = differenceInCalendarDays(startOfDay(date), startOfDay(reference));
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  return `${formatWeekdayShort(date)}, ${formatDateMedium(date)}`;
}

/** "há 22 dias" / "em 3 dias" — usado nos blocos de recorrência e histórico. */
export function formatDayDistance(date: Date, reference = new Date()): string {
  const diff = differenceInCalendarDays(startOfDay(reference), startOfDay(date));
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'ontem';
  if (diff === -1) return 'amanhã';
  if (diff > 1) return `há ${diff} dias`;
  return `em ${Math.abs(diff)} dias`;
}

export function daysSince(date: Date, reference = new Date()): number {
  return differenceInCalendarDays(startOfDay(reference), startOfDay(date));
}

export function startOfWeekMonday(date: Date): Date {
  const d = startOfDay(date);
  const weekday = d.getDay();
  const delta = weekday === 0 ? -6 : 1 - weekday;
  return addDays(d, delta);
}

export function eachDay(from: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, i) => addDays(startOfDay(from), i));
}
