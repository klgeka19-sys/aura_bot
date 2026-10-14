/**
 * Helper to obtain formatted current device system time and date
 * Exact format requested: [Текущее время: ЧЧ:ММ, Дата: ДД.ММ.ГГГГ]
 */
export function getDeviceFormattedTime(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  return `[Текущее время: ${hours}:${minutes}, Дата: ${day}.${month}.${year}]`;
}

/**
 * Returns time of day descriptor based on hours (0-23)
 */
export function getTimeOfDayPeriod(hours: number): 'morning' | 'day' | 'evening' | 'night' {
  if (hours >= 5 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 18) return 'day';
  if (hours >= 18 && hours < 23) return 'evening';
  return 'night';
}
