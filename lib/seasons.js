// Works out the church-calendar dates for a year and picks the active season.

import { SEASONS } from '../config/seasons.js';

const dateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Western (Gregorian) Easter Sunday — Anonymous Gregorian algorithm. */
export function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** nth weekday (0 = Sunday) of a month, e.g. 4th Thursday of November. */
function nthWeekday(year, month, weekday, n) {
  const first = new Date(year, month - 1, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month - 1, 1 + offset + 7 * (n - 1));
}

export function calendarDates(year) {
  const easter = easterSunday(year);
  const christmas = new Date(year, 11, 25);
  // Advent begins on the fourth Sunday before Christmas.
  const sundayBeforeChristmas = addDays(christmas, -(christmas.getDay() || 7));
  return {
    easter,
    ashWednesday: addDays(easter, -46),
    palmSunday: addDays(easter, -7),
    maundyThursday: addDays(easter, -3),
    goodFriday: addDays(easter, -2),
    holySaturday: addDays(easter, -1),
    ascension: addDays(easter, 39),
    pentecost: addDays(easter, 49),
    adventStart: addDays(sundayBeforeChristmas, -21),
    thanksgiving: nthWeekday(year, 11, 4, 4),
    mothersDay: nthWeekday(year, 5, 0, 2),
    fathersDay: nthWeekday(year, 6, 0, 3),
  };
}

/** Returns the season (with its five suggested verses) for a given date. */
export function currentSeason(date = new Date(), seasons = SEASONS) {
  const d = dateOnly(date);
  const dates = calendarDates(d.getFullYear());
  const season = seasons.find((s) => s.when(d, dates)) || seasons[seasons.length - 1];
  return { id: season.id, name: season.name, verses: season.verses.slice(0, 5) };
}

/** Parses "YYYY-MM-DD" into a local date, or returns null. */
export function parseDateParam(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}
