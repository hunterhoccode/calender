import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isWithinInterval,
  areIntervalsOverlapping,
  differenceInDays,
  parseISO,
  isWeekend,
  addDays,
  getDay,
} from 'date-fns';
import { vi } from 'date-fns/locale';

export {
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isWithinInterval,
  differenceInDays,
  parseISO,
  isWeekend,
  addDays,
  getDay,
};

export const getCalendarDays = (date) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
};

export const getWeekDays = (date) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: weekStart, end: weekEnd });
};

export const getTimelineDays = (date, daysCount = 31) => {
  const start = startOfMonth(date);
  return eachDayOfInterval({ start, end: addDays(start, daysCount - 1) });
};

export const formatDate = (date, formatStr = 'yyyy-MM-dd') => {
  return format(date, formatStr);
};

export const formatDateDisplay = (date, formatStr = 'dd MMM yyyy') => {
  return format(date, formatStr);
};

export const formatMonthYear = (date) => {
  return format(date, 'MMMM yyyy');
};

export const formatWeekRange = (date) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  return `${format(weekStart, 'dd MMM')} – ${format(weekEnd, 'dd MMM yyyy')}`;
};

export const getCampaignsForDay = (campaigns, day) => {
  return campaigns.filter((campaign) => {
    const start = parseISO(campaign.startDate);
    const end = parseISO(campaign.endDate);
    return isWithinInterval(day, { start, end });
  });
};

export const checkOverlaps = (campaigns) => {
  const overlaps = [];
  for (let i = 0; i < campaigns.length; i++) {
    for (let j = i + 1; j < campaigns.length; j++) {
      const a = campaigns[i];
      const b = campaigns[j];
      try {
        if (
          areIntervalsOverlapping(
            { start: parseISO(a.startDate), end: parseISO(a.endDate) },
            { start: parseISO(b.startDate), end: parseISO(b.endDate) }
          )
        ) {
          overlaps.push([a.id, b.id]);
        }
      } catch (e) {
        // skip invalid dates
      }
    }
  }
  return overlaps;
};

export const getStatusForCampaign = (campaign) => {
  const now = new Date();
  const start = parseISO(campaign.startDate);
  const end = parseISO(campaign.endDate);

  if (now < start) return 'upcoming';
  if (now > end) return 'completed';
  return 'active';
};

export const CATEGORIES = [
  { id: 'big-campaign', label: 'Campaign Lớn', color: 'red' },
  { id: 'flash-sale', label: 'Flash Sale', color: 'blue' },
  { id: 'social', label: 'Social Media', color: 'yellow' },
  { id: 'email', label: 'Email Marketing', color: 'purple' },
  { id: 'event', label: 'Event / PR', color: 'orange' },
  { id: 'content', label: 'Content', color: 'green' },
];

export const CHANNELS = [
  'Facebook',
  'Google Ads',
  'TikTok',
  'Instagram',
  'Email',
  'YouTube',
  'Zalo',
  'Website',
  'Online',
  'Offline',
];

export const getCategoryColor = (categoryId) => {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  return cat ? cat.color : 'blue';
};

export const getCategoryLabel = (categoryId) => {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  return cat ? cat.label : categoryId;
};
