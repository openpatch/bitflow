import {
  format as dFormat,
  formatDistance as dFormatDistance,
  formatDistanceStrict as dFormatDistanceStrict,
  formatDistanceToNow as dFormatDistanceToNow,
  formatDistanceToNowStrict as dFormatDistanceToNowStrict,
  formatDuration as dFormatDuration,
} from "date-fns";
import { locales } from "./locales";

export const format: typeof dFormat = (date, formatString, options = {}) => {
  const locale = (window as any).__localeId__;
  if (!options?.locale) {
    options.locale = locales[locale];
  }

  return dFormat(date, formatString, options);
};

export const formatDistance: typeof dFormatDistance = (
  date,
  baseDate,
  options = {}
) => {
  const locale = (window as any).__localeId__;
  if (!options.locale) {
    options.locale = locales[locale];
  }
  return dFormatDistance(date, baseDate, options);
};

export const formatDistanceToNow: typeof dFormatDistanceToNow = (
  date,
  options = {}
) => {
  const locale = (window as any).__localeId__;
  if (!options.locale) {
    options.locale = locales[locale];
  }
  return dFormatDistanceToNow(date, options);
};

export const formatDuration: typeof dFormatDuration = (
  duration,
  options = {}
) => {
  const locale = (window as any).__localeId__;
  if (!options.locale) {
    options.locale = locales[locale];
  }
  return dFormatDuration(duration, options);
};

export const formatDistanceStrict: typeof dFormatDistanceStrict = (
  date,
  baseDate,
  options = {}
) => {
  const locale = (window as any).__localeId__;
  if (!options.locale) {
    options.locale = locales[locale];
  }

  return dFormatDistanceStrict(date, baseDate, options);
};

export const formatDistanceToNowStrict: typeof dFormatDistanceToNowStrict = (
  date,
  options = {}
) => {
  const locale = (window as any).__localeId__;
  if (!options.locale) {
    options.locale = locales[locale];
  }

  return dFormatDistanceToNowStrict(date, options);
};
