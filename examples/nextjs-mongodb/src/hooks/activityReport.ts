import { ActivityReport } from "@schemas/activityReport";
import useSWR, { SWRResponse } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useActivityReport(
  id?: string
): [ActivityReport | null, SWRResponse<{ report: ActivityReport }, any>] {
  const { data, ...rest } = useSWR<{ report: ActivityReport }>(
    id ? "/api/activities/" + id + "/report" : null,
    fetcher
  );
  const report = (data && data.report) || null;
  return [report, rest];
}
