import { User } from "@schemas/user";
import useSWR, { SWRResponse } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useUser(
  id?: string
): [User | null, SWRResponse<{ user: User }, any>] {
  const { data, ...rest } = useSWR<{ user: User }>(
    id ? "/api/users/" + id : null,
    fetcher
  );
  const user = (data && data.user) || null;
  return [user, rest];
}

export function useUsers(): [User[], SWRResponse<{ users: User[] }, any>] {
  const { data, ...rest } = useSWR<{ users: User[] }>("/api/users", fetcher);
  const users = (data && data.users) || [];
  return [users, rest];
}
