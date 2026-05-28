import { TechEvent } from '../types';
import { format } from 'date-fns';

// 格式化日期为 iCalendar 格式
const formatICalDate = (date: Date): string => {
  return format(date, "yyyyMMdd'T'HHmmss'Z'");
};

const getEventLocation = (event: TechEvent): string => {
  if (event.location) {
    return [event.location.address, event.location.city, event.location.country].filter(Boolean).join(', ');
  }

  return event.format === 'online' ? '线上活动' : '';
};

const getCalendarDetails = (event: TechEvent): string => {
  const organizers = event.organizers?.length ? event.organizers.join(' / ') : event.organizer.name;
  const detailUrl = event.links.registration || (event.links.officialSite !== '#' ? event.links.officialSite : '');
  return `${event.summary}\n\n主办方：${organizers}${detailUrl ? `\n\n活动详情：${detailUrl}` : ''}`;
};

const getDownloadName = (title: string): string => {
  const normalizedTitle = title
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '-');

  return `${normalizedTitle || 'datawhale-aix-event'}.ics`;
};

// 生成 .ics 文件内容
export const generateICS = (event: TechEvent): string => {
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const locationStr = getEventLocation(event);
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Datawhale//AI+X Calendar//ZH-CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatICalDate(startDate)}`,
    `DTEND:${formatICalDate(endDate)}`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${getCalendarDetails(event).replace(/\n/g, '\\n')}`,
    `LOCATION:${locationStr}`,
    `URL:${event.links.officialSite}`,
    `STATUS:CONFIRMED`,
    `SEQUENCE:0`,
    `UID:${event.id}@datawhale.club`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsContent;
};

// 下载 .ics 文件
export const downloadICS = (event: TechEvent): void => {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = getDownloadName(event.title);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// 生成 Google Calendar 链接
export const getGoogleCalendarUrl = (event: TechEvent): string => {
  const startDate = format(new Date(event.startTime), "yyyyMMdd'T'HHmmss'Z'");
  const endDate = format(new Date(event.endTime), "yyyyMMdd'T'HHmmss'Z'");
  
  const locationStr = getEventLocation(event);
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDate}/${endDate}`,
    details: getCalendarDetails(event),
    location: locationStr,
    sprop: 'website:datawhale.club'
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// 生成 Outlook 链接
export const getOutlookUrl = (event: TechEvent): string => {
  const startDate = new Date(event.startTime).toISOString();
  const endDate = new Date(event.endTime).toISOString();
  
  const locationStr = getEventLocation(event);
  
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: startDate,
    enddt: endDate,
    body: getCalendarDetails(event),
    location: locationStr
  });
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

// 生成 Apple Calendar 链接（使用 .ics 下载）
export const addToAppleCalendar = (event: TechEvent): void => {
  downloadICS(event);
};
