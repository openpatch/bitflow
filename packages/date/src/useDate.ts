import { useLocale } from "@bitflow/provider";
import {
  format,
  formatDistance,
  formatDistanceStrict,
  formatDistanceToNow,
  formatDuration,
} from "date-fns";
import { locales } from "./locales";

export const useDate = () => {
  const [locale] = useLocale();

  const customFormat: typeof format = (date, formatString, options = {}) => {
    if (!options?.locale) {
      options.locale = locales[locale];
    }

    return format(date, formatString, options);
  };

  const customFormatDistance: typeof formatDistance = (
    date,
    baseDate,
    options = {}
  ) => {
    if (!options.locale) {
      options.locale = locales[locale];
    }
    return formatDistance(date, baseDate, options);
  };

  const customFormatDistanceToNow: typeof formatDistanceToNow = (
    date,
    options = {}
  ) => {
    if (!options.locale) {
      options.locale = locales[locale];
    }

    return formatDistanceToNow(date, options);
  };

  const customFormatDuration: typeof formatDuration = (
    duration,
    options = {}
  ) => {
    if (!options.locale) {
      options.locale = locales[locale];
    }
    return formatDuration(duration, options);
  };

  const customFormatDistanceStrict: typeof formatDistanceStrict = (
    date,
    baseDate,
    options = {}
  ) => {
    if (!options.locale) {
      options.locale = locales[locale];
    }

    return formatDistanceStrict(date, baseDate, options);
  };

  const customFormatDistanceToNowStrict: typeof formatDistanceToNow = (
    date,
    options = {}
  ) => {
    if (!options.locale) {
      options.locale = locales[locale];
    }

    return formatDistanceToNow(date, options);
  };

  return {
    format: customFormat,
    formatDistance: customFormatDistance,
    formatDistanceStrict: customFormatDistanceStrict,
    formatDuration: customFormatDuration,
    formatDistanceToNow: customFormatDistanceToNow,
    formatDistanceToNowStrict: customFormatDistanceToNowStrict,
  };
};
