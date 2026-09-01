import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { getUserTimezone } from '../utils/timezone';

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
];

// In-memory token caching
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Create Google Auth Provider with Calendar Events scope
export const calendarAuthProvider = new GoogleAuthProvider();
CALENDAR_SCOPES.forEach(scope => calendarAuthProvider.addScope(scope));
calendarAuthProvider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'offline'
});

// Listener to clear token on sign out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

/**
 * Initiates Google sign-in with Calendar scopes or retrieves active access token
 */
export async function getCalendarAccessToken(forcePrompt = false): Promise<string> {
  if (cachedAccessToken && !forcePrompt) {
    return cachedAccessToken;
  }

  if (isSigningIn) {
    // Wait for in-flight sign-in
    await new Promise(resolve => setTimeout(resolve, 500));
    if (cachedAccessToken) return cachedAccessToken;
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, calendarAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve Google Calendar access token from authorization credential.');
    }
    cachedAccessToken = credential.accessToken;
    return cachedAccessToken;
  } catch (err: any) {
    console.error('Google Calendar OAuth error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
}

export function isCalendarConnected(): boolean {
  return !!cachedAccessToken;
}

export function disconnectCalendar(): void {
  cachedAccessToken = null;
}

export interface GoogleCalendarReminderOption {
  method: 'popup' | 'email';
  minutes: number;
}

export interface PlantCareEventPayload {
  plantName: string;
  type: 'water' | 'fertilize' | 'prune' | 'mist' | 'repot' | string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  timeZone?: string; // e.g. "America/New_York"
  notes?: string;
  scientificName?: string;
  reminderMinutes?: number[]; // e.g. [15, 60]
}

export interface GoogleCalendarEventResponse {
  id: string;
  htmlLink: string;
  summary: string;
  status: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
}

/**
 * Creates a scheduled botanical care event in the user's primary Google Calendar
 * with push notifications (popups) and email reminders formatted in the user's timezone.
 */
export async function createGoogleCalendarCareEvent(
  payload: PlantCareEventPayload,
  token?: string
): Promise<GoogleCalendarEventResponse> {
  const accessToken = token || (await getCalendarAccessToken());
  const userTimezone = payload.timeZone || getUserTimezone();

  // Determine icon & color based on care type
  let typeEmoji = '🌿';
  let colorId = '2'; // Sage Green default
  if (payload.type.includes('water')) {
    typeEmoji = '💧';
    colorId = '7'; // Peacock / Cyan blue
  } else if (payload.type.includes('fertiliz')) {
    typeEmoji = '🌱';
    colorId = '5'; // Banana / Yellow-amber
  } else if (payload.type.includes('prun')) {
    typeEmoji = '✂️';
    colorId = '11'; // Flamingo / Coral
  } else if (payload.type.includes('mist')) {
    typeEmoji = '💦';
    colorId = '1'; // Lavender / Light blue
  }

  const summary = `${typeEmoji} ${payload.type.toUpperCase()}: ${payload.plantName}`;
  const description = [
    `🌿 Botanical Care Reminder for ${payload.plantName}`,
    payload.scientificName ? `Scientific Name: ${payload.scientificName}` : '',
    `Task Type: ${payload.type}`,
    `Timezone: ${userTimezone}`,
    payload.notes ? `Care Notes: ${payload.notes}` : '',
    '',
    '----------------------------------------',
    'Automated via Floravia Botanical Neural System 🌱',
    'Tag: #FloraviaCare #PlantCare'
  ].filter(Boolean).join('\n');

  // Reminders for push notifications
  const reminderMinutes = payload.reminderMinutes || [60, 15];
  const reminderOverrides: GoogleCalendarReminderOption[] = reminderMinutes.map(mins => ({
    method: 'popup',
    minutes: mins
  }));
  // Also add 1-day advance email if 60+ min
  reminderOverrides.push({ method: 'email', minutes: 1440 });

  let eventBody: any = {
    summary,
    description,
    colorId,
    reminders: {
      useDefault: false,
      overrides: reminderOverrides
    }
  };

  if (payload.time && payload.time.includes(':')) {
    // Specific time event formatted with explicit user timezone
    const [h, m] = payload.time.split(':').map(Number);
    const startHour = isNaN(h) ? 9 : h;
    const startMinute = isNaN(m) ? 0 : m;
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    // Calculate 30-minute block
    let endHour = startHour;
    let endMinute = startMinute + 30;
    if (endMinute >= 60) {
      endHour = (endHour + 1) % 24;
      endMinute = endMinute % 60;
    }

    eventBody.start = {
      dateTime: `${payload.date}T${pad(startHour)}:${pad(startMinute)}:00`,
      timeZone: userTimezone
    };
    eventBody.end = {
      dateTime: `${payload.date}T${pad(endHour)}:${pad(endMinute)}:00`,
      timeZone: userTimezone
    };
  } else {
    // All day event with user timezone
    eventBody.start = { date: payload.date, timeZone: userTimezone };
    eventBody.end = { date: payload.date, timeZone: userTimezone };
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventBody)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    if (res.status === 401) {
      cachedAccessToken = null;
      throw new Error('Google Calendar authorization expired. Please reconnect your account.');
    }
    throw new Error(errData.error?.message || `Failed to create calendar event (${res.status})`);
  }

  return await res.json();
}

/**
 * Synchronizes multiple care tasks to Google Calendar in batch
 */
export async function syncCareEventsToGoogleCalendar(
  events: PlantCareEventPayload[],
  onProgress?: (current: number, total: number, plantName: string) => void
): Promise<{ successCount: number; results: { plantName: string; eventId?: string; error?: string; htmlLink?: string }[] }> {
  const accessToken = await getCalendarAccessToken();
  const results: { plantName: string; eventId?: string; error?: string; htmlLink?: string }[] = [];
  let successCount = 0;

  for (let i = 0; i < events.length; i++) {
    const evt = events[i];
    if (onProgress) {
      onProgress(i + 1, events.length, evt.plantName);
    }
    try {
      const created = await createGoogleCalendarCareEvent(evt, accessToken);
      results.push({
        plantName: evt.plantName,
        eventId: created.id,
        htmlLink: created.htmlLink
      });
      successCount++;
    } catch (err: any) {
      results.push({
        plantName: evt.plantName,
        error: err.message
      });
    }
  }

  return { successCount, results };
}

/**
 * Deletes a synchronized event from Google Calendar (requires user confirmation before invocation)
 */
export async function deleteGoogleCalendarEvent(eventId: string): Promise<boolean> {
  const accessToken = await getCalendarAccessToken();
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (res.status === 204 || res.status === 200) {
    return true;
  }
  if (res.status === 404) {
    return true; // Already deleted
  }
  if (res.status === 401) {
    cachedAccessToken = null;
    throw new Error('Google Calendar authorization expired. Please reconnect your account.');
  }

  const errData = await res.json().catch(() => ({}));
  throw new Error(errData.error?.message || 'Failed to delete event from Google Calendar');
}

/**
 * Lists upcoming Floravia plant care events from Google Calendar
 */
export async function listSyncedFloraviaCalendarEvents(): Promise<GoogleCalendarEventResponse[]> {
  try {
    const accessToken = await getCalendarAccessToken();
    const now = new Date().toISOString();
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('q', 'FloraviaCare');
    url.searchParams.set('timeMin', now);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', '50');

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        cachedAccessToken = null;
      }
      return [];
    }

    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error('Error listing Google Calendar events:', err);
    return [];
  }
}
