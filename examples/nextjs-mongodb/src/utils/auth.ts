import { User } from "@schemas/user";
import { IncomingMessage } from "node:http";
import { get } from "./fetcher";
import { url } from "./url";

export const getAuth = async (req?: IncomingMessage) => {
  const headers: HeadersInit = new Headers();
  if (req?.headers.cookie) {
    headers.set("cookie", req?.headers?.cookie);
  }
  return get<{ user: Pick<User, "username" | "email"> | null }>(
    url("/api/auth/user"),
    {
      headers,
    }
  )
    .then((r) => r.json())
    .then((r) => r.user)
    .catch((e) => {
      console.error(e);
      return null;
    });
};
