import { NextApiResponse } from "next";
import { setCookie } from "./cookie";

export type Locale = "en" | "de";

export const defaultLocale: Locale = "en";
export const locales: Locale[] = ["en", "de"];

export const setLocale = async (res: NextApiResponse, locale: Locale) => {
  setCookie(res, "NEXT_LOCALE", locale);
};
