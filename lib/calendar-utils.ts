/**
 * Utilitaires pour générer des liens de calendrier
 */

interface CalendarEventData {
  title: string;
  description: string;
  location: string;
  startDate: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:MM
  endTime: string; // Format: HH:MM
}

/**
 * Génère un lien Google Calendar
 * Documentation: https://github.com/InteractionDesignFoundation/add-event-to-calendar-docs/blob/main/services/google.md
 */
export function generateGoogleCalendarLink(event: CalendarEventData): string {
  const { title, description, location, startDate, startTime, endTime } = event;

  // Convertir la date et l'heure en format Google Calendar (YYYYMMDDTHHMMSS)
  const formatDateTime = (date: string, time: string): string => {
    const [year, month, day] = date.split("-");
    const [hours, minutes] = time.split(":");
    return `${year}${month}${day}T${hours}${minutes}00`;
  };

  const start = formatDateTime(startDate, startTime);
  const end = formatDateTime(startDate, endTime);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details: description,
    location: location,
    sf: "true",
    output: "xml",
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
}

/**
 * Génère un lien iCalendar (.ics file)
 */
export function generateICalendarLink(event: CalendarEventData): string {
  const { title, description, location, startDate, startTime, endTime } = event;

  // Format iCal datetime
  const formatDateTime = (date: string, time: string): string => {
    const [year, month, day] = date.split("-");
    const [hours, minutes] = time.split(":");
    return `${year}${month}${day}T${hours}${minutes}00`;
  };

  const start = formatDateTime(startDate, startTime);
  const end = formatDateTime(startDate, endTime);

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Encore Pilates//Course Booking//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
SUMMARY:${title}
DESCRIPTION:${description.replace(/\n/g, "\\n")}
LOCATION:${location}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

  // Encode as data URI
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
}

/**
 * Génère un lien Outlook Calendar
 */
export function generateOutlookCalendarLink(event: CalendarEventData): string {
  const { title, description, location, startDate, startTime, endTime } = event;

  // Format datetime pour Outlook (ISO 8601)
  const formatDateTime = (date: string, time: string): string => {
    return `${date}T${time}:00`;
  };

  const start = formatDateTime(startDate, startTime);
  const end = formatDateTime(startDate, endTime);

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title,
    body: description,
    location: location,
    startdt: start,
    enddt: end,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
