import { Activity } from "@schemas/activity";
import { get } from "./fetcher";

export const getActivity = async (id: string) => {
  return get<{ activity: Activity | null }>("/api/activities/" + id)
    .then((r) => r.json())
    .then((r) => r.activity)
    .catch((e) => {
      return null;
    });
};

export const getActivities = async () => {
  return get<{ activities: Activity[] | null }>("/api/activities")
    .then((r) => r.json())
    .then((r) => r.activities)
    .catch((e) => {
      return null;
    });
};