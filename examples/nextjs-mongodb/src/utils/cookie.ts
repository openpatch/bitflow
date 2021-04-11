import { CookieSerializeOptions, serialize } from "cookie";
import { NextApiResponse } from "next";

/**
 * This sets `cookie` using the `res` object
 */

export const setCookie = (
  res: NextApiResponse,
  cookies: Array<{
    name: string;
    value: unknown;
    options: CookieSerializeOptions;
  }>
) => {
  const header = cookies.map(({ name, value, options = {} }) => {
    const stringValue =
      typeof value === "object" ? "j:" + JSON.stringify(value) : String(value);

    options.sameSite = "lax";
    options.path = "/";

    if (options?.maxAge) {
      options.expires = new Date(Date.now() + options.maxAge);
      options.maxAge /= 1000;
    }

    return serialize(name, String(stringValue), options);
  });

  res.setHeader("Set-Cookie", header);
};
