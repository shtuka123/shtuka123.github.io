import { misc } from '../data/misc';
import { research } from '../data/research';
import { teaching } from '../data/teaching';
import { longDate } from './format';
import { getAllPosts } from './posts';

function dateFromParts(year: number, month = 0, day = 1) {
  return new Date(Date.UTC(year, month, day));
}

function parseContentDate(label: string): Date | undefined {
  const normalized = label.trim();
  const exact = Date.parse(normalized);

  if (!Number.isNaN(exact)) {
    return new Date(exact);
  }

  const yearMatch = normalized.match(/\b(20\d{2}|19\d{2})\b/);
  if (!yearMatch) {
    return undefined;
  }

  const year = Number(yearMatch[1]);
  const lower = normalized.toLowerCase();

  if (lower.includes('fall')) {
    return dateFromParts(year, 7, 1);
  }

  if (lower.includes('summer')) {
    return dateFromParts(year, 5, 1);
  }

  if (lower.includes('spring')) {
    return dateFromParts(year, 0, 1);
  }

  return dateFromParts(year);
}

function maxDate(dates: Date[]) {
  return dates.reduce((latest, date) => (date > latest ? date : latest));
}

export async function getLastUpdatedDate() {
  const posts = await getAllPosts();
  const dates = [
    ...posts.map((post) => post.data.date),
    ...research.map((item) => parseContentDate(item.year)),
    ...teaching.map((item) => parseContentDate(item.semester)),
    ...misc.map((item) => parseContentDate(item.year))
  ].filter((date): date is Date => Boolean(date));

  return dates.length > 0 ? maxDate(dates) : undefined;
}

export async function getLastUpdatedLabel() {
  const date = await getLastUpdatedDate();
  return date ? longDate(date) : 'unknown';
}
