import useSWR, { SWRResponse } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useAuth(): [
  {
    _id: string;
    username: string;
    email: string;
  } | null,
  SWRResponse<
    {
      user: {
        _id: string;
        username: string;
        email: string;
      };
    },
    any
  >
] {
  const { data, ...rest } = useSWR("/api/auth/user", fetcher);
  const user = data && data.user;
  return [user, rest];
}
