import { ActivitySessionPath } from "@schemas/activitySessionPath";
import useSWR, { SWRResponse } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useActivitySessionPathForNode(
  sid?: string,
  pid?: string,
  mode: "first" | "last" | "partial" = "first"
): [
  (ActivitySessionPath & { status: "finished" }) | null,
  SWRResponse<{ path: ActivitySessionPath & { status: "finished" } }, any>
] {
  const { data, ...rest } = useSWR<{
    path: ActivitySessionPath & { status: "finished" };
  }>(
    sid && pid
      ? "/api/sessions/" + sid + "/paths/" + pid + `?mode=${mode}`
      : null,
    fetcher
  );
  const path = (data && data.path) || null;
  return [path, rest];
}
