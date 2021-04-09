import { Activity } from "@schemas/activity";
import useSWR, { SWRResponse } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useActivity(
  id?: string
): [Activity | null, SWRResponse<{ activity: Activity }, any>] {
  const { data, ...rest } = useSWR<{ activity: Activity }>(
    id ? "/api/activities/" + id : null,
    fetcher
  );
  const activity = (data && data.activity) || null;
  return [activity, rest];
}

export function useActivities(): [
  Activity[],
  SWRResponse<{ activities: Activity[] }, any>
] {
  const { data, ...rest } = useSWR<{
    activities: Activity[];
  }>("/api/activities", fetcher);
  const activities = data?.activities || [];
  return [activities, { ...rest }];
}
