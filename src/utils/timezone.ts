/**
 * Timezone Utility for Floravia Botanical Neural System
 * Ensures all plant reminders, calendar events, and AI scheduling
 * calculate execution at the user's exact local time (e.g., 9:00 AM user time)
 * rather than arbitrary server or UTC time.
 */

export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
  region: string;
}

const TIMEZONE_STORAGE_KEY = 'floravia_user_timezone';

/**
 * Common list of popular IANA timezones grouped by region for intuitive selection.
 */
export const COMMON_TIMEZONES: TimezoneOption[] = [
  // US & Canada
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)', offset: 'UTC-04:00/05:00', region: 'Americas' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)', offset: 'UTC-05:00/06:00', region: 'Americas' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)', offset: 'UTC-06:00/07:00', region: 'Americas' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)', offset: 'UTC-07:00/08:00', region: 'Americas' },
  { value: 'America/Anchorage', label: 'Alaska Time', offset: 'UTC-08:00/09:00', region: 'Americas' },
  { value: 'Pacific/Honolulu', label: 'Hawaii-Aleutian Standard Time', offset: 'UTC-10:00', region: 'Americas' },
  { value: 'America/Toronto', label: 'Toronto (Eastern)', offset: 'UTC-04:00/05:00', region: 'Americas' },
  { value: 'America/Vancouver', label: 'Vancouver (Pacific)', offset: 'UTC-07:00/08:00', region: 'Americas' },
  { value: 'America/Mexico_City', label: 'Mexico City', offset: 'UTC-06:00', region: 'Americas' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (Brasília)', offset: 'UTC-03:00', region: 'Americas' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires', offset: 'UTC-03:00', region: 'Americas' },

  // Europe
  { value: 'Europe/London', label: 'London, Dublin, Edinburgh (GMT/BST)', offset: 'UTC+00:00/01:00', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris, Madrid, Rome, Berlin (CET/CEST)', offset: 'UTC+01:00/02:00', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam, Brussels', offset: 'UTC+01:00/02:00', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin, Frankfurt, Munich', offset: 'UTC+01:00/02:00', region: 'Europe' },
  { value: 'Europe/Athens', label: 'Athens, Bucharest, Helsinki (EET/EEST)', offset: 'UTC+02:00/03:00', region: 'Europe' },
  { value: 'Europe/Istanbul', label: 'Istanbul (TRT)', offset: 'UTC+03:00', region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow Standard Time', offset: 'UTC+03:00', region: 'Europe' },

  // Asia & Middle East
  { value: 'Asia/Dubai', label: 'Dubai, Abu Dhabi (GST)', offset: 'UTC+04:00', region: 'Asia & Middle East' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST - Delhi, Mumbai, Bengaluru)', offset: 'UTC+05:30', region: 'Asia & Middle East' },
  { value: 'Asia/Dhaka', label: 'Dhaka (BST)', offset: 'UTC+06:00', region: 'Asia & Middle East' },
  { value: 'Asia/Bangkok', label: 'Bangkok, Hanoi, Jakarta (ICT)', offset: 'UTC+07:00', region: 'Asia & Middle East' },
  { value: 'Asia/Singapore', label: 'Singapore, Kuala Lumpur (SGT)', offset: 'UTC+08:00', region: 'Asia & Middle East' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong, Beijing, Shanghai (CST)', offset: 'UTC+08:00', region: 'Asia & Middle East' },
  { value: 'Asia/Tokyo', label: 'Tokyo, Osaka (JST)', offset: 'UTC+09:00', region: 'Asia & Middle East' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)', offset: 'UTC+09:00', region: 'Asia & Middle East' },

  // Australia & Pacific
  { value: 'Australia/Perth', label: 'Perth (AWST)', offset: 'UTC+08:00', region: 'Australia & Pacific' },
  { value: 'Australia/Adelaide', label: 'Adelaide (ACST/ACDT)', offset: 'UTC+09:30/10:30', region: 'Australia & Pacific' },
  { value: 'Australia/Sydney', label: 'Sydney, Melbourne, Canberra (AEST/AEDT)', offset: 'UTC+10:00/11:00', region: 'Australia & Pacific' },
  { value: 'Australia/Brisbane', label: 'Brisbane (AEST - No DST)', offset: 'UTC+10:00', region: 'Australia & Pacific' },
  { value: 'Pacific/Auckland', label: 'Auckland, Wellington (NZST/NZDT)', offset: 'UTC+12:00/13:00', region: 'Australia & Pacific' },

  // Africa
  { value: 'Africa/Cairo', label: 'Cairo (EET)', offset: 'UTC+02:00', region: 'Africa' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg, Cape Town (SAST)', offset: 'UTC+02:00', region: 'Africa' },
  { value: 'Africa/Lagos', label: 'Lagos, Nairobi (WAT/EAT)', offset: 'UTC+01:00/03:00', region: 'Africa' },

  // Universal
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)', offset: 'UTC+00:00', region: 'UTC' }
];

/**
 * Returns the device's native browser timezone (e.g. 'America/New_York')
 */
export function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  } catch {
    return 'America/New_York';
  }
}

/**
 * Returns the user's configured timezone from storage or falls back to device timezone.
 */
export function getUserTimezone(preferredTimezone?: string): string {
  if (preferredTimezone && isValidTimezone(preferredTimezone)) {
    return preferredTimezone;
  }
  try {
    const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (stored && isValidTimezone(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage errors
  }
  return getDeviceTimezone();
}

/**
 * Persists the user timezone in local cache.
 */
export function setUserTimezoneCache(timezone: string): void {
  try {
    if (isValidTimezone(timezone)) {
      localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Validates if an IANA timezone string is recognized by the browser.
 */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates an exact UTC Date timestamp representing a specific date ("YYYY-MM-DD")
 * and time ("09:00" or "9:00 AM") within a given IANA timezone.
 * 
 * Example:
 * createDateInTimezone("2026-08-25", "09:00", "America/New_York")
 * -> Exact UTC Date instant corresponding to 9:00 AM EDT on Aug 25, 2026.
 */
export function createDateInTimezone(
  dateStr: string,
  timeStr: string = '09:00',
  timeZone: string = getUserTimezone()
): Date {
  const tz = isValidTimezone(timeZone) ? timeZone : getDeviceTimezone();

  // Parse hours & minutes
  let hours = 9;
  let minutes = 0;
  if (timeStr) {
    const isPM = /pm/i.test(timeStr);
    const isAM = /am/i.test(timeStr);
    const clean = timeStr.replace(/[^0-9:]/g, '');
    const parts = clean.split(':').map(Number);
    hours = parts[0] || 0;
    minutes = parts[1] || 0;
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const targetIsoPrefix = `${dateStr}T${pad(hours)}:${pad(minutes)}:00`;

  // 1. Initial UTC guess
  const guess = new Date(`${targetIsoPrefix}Z`);

  // 2. Measure timezone offset for that date in the target timezone
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(guess);
    const map: Record<string, number> = {};
    parts.forEach(p => {
      if (p.type !== 'literal') map[p.type] = Number(p.value);
    });

    const hour = map.hour === 24 ? 0 : map.hour;
    const formattedInTz = new Date(Date.UTC(map.year, map.month - 1, map.day, hour, map.minute, map.second));
    const offsetMs = formattedInTz.getTime() - guess.getTime();

    return new Date(guess.getTime() - offsetMs);
  } catch (err) {
    console.warn(`Timezone calculation fallback for ${tz}:`, err);
    return new Date(`${dateStr}T${pad(hours)}:${pad(minutes)}:00`);
  }
}

/**
 * Calculates next reminder execution date & time in the user's timezone.
 * E.g., if daysAhead=1 and targetTime="09:00", computes tomorrow at 9:00 AM user timezone.
 */
export function getNextReminderOccurrence(
  daysAhead: number = 1,
  targetTime: string = '09:00',
  timeZone: string = getUserTimezone()
): { dateStr: string; timeStr: string; dueDate: Date } {
  const tz = isValidTimezone(timeZone) ? timeZone : getDeviceTimezone();
  
  // Get current local date in the target timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { // Returns YYYY-MM-DD
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const todayLocalStr = formatter.format(now); // e.g. "2026-08-24"
  const [year, month, day] = todayLocalStr.split('-').map(Number);
  
  // Add days ahead
  const targetDateObj = new Date(Date.UTC(year, month - 1, day + daysAhead));
  const targetDateStr = targetDateObj.toISOString().split('T')[0];
  
  const dueDate = createDateInTimezone(targetDateStr, targetTime, tz);
  return {
    dateStr: targetDateStr,
    timeStr: targetTime,
    dueDate
  };
}

/**
 * Formats a Date / Firestore Timestamp in the user's timezone with custom options.
 */
export function formatInUserTimezone(
  date: Date | any,
  timeZone: string = getUserTimezone(),
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  if (!date) return '';
  const d = date?.toDate?.() ? date.toDate() : date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const tz = isValidTimezone(timeZone) ? timeZone : getDeviceTimezone();
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      ...options
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

/**
 * Returns user's current local time string (e.g., "09:45 AM EDT (America/New_York)")
 */
export function getUserLocalCurrentTimeString(timeZone: string = getUserTimezone()): string {
  const tz = isValidTimezone(timeZone) ? timeZone : getDeviceTimezone();
  try {
    const timeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    }).format(new Date());
    return `${timeStr} (${tz})`;
  } catch {
    return new Date().toLocaleTimeString();
  }
}

/**
 * Calculates the offset string (e.g. "GMT-4" or "GMT+5:30") for display.
 */
export function getTimezoneDisplayOffset(timeZone: string = getUserTimezone()): string {
  const tz = isValidTimezone(timeZone) ? timeZone : getDeviceTimezone();
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset'
    }).formatToParts(new Date());
    const offsetPart = parts.find(p => p.type === 'timeZoneName');
    return offsetPart?.value || tz;
  } catch {
    return tz;
  }
}
