import { Activity, ActivityDB } from "@schemas/activity";
import { ObjectId } from "bson";
import { Db } from "mongodb";

const collection = "activities";

export const findActivities = (db: Db): Promise<Activity[]> => {
  return db.collection<Activity>(collection).find().toArray();
};

export const findActivityById = (
  db: Db,
  id: ObjectId | string
): Promise<ActivityDB | null> => {
  return db
    .collection<ActivityDB>(collection)
    .findOne({ _id: new ObjectId(id) });
};

export const updateActivity = (
  db: Db,
  id: ObjectId | string,
  data: Partial<Omit<Activity, "_id">>
) => {
  return db
    .collection<ActivityDB>(collection)
    .updateOne({ _id: new ObjectId(id) }, data);
};

export const createActivity = async (
  db: Db,
  activity: Omit<Activity, "_id">
) => {
  return db
    .collection<Omit<ActivityDB, "_id">>(collection)
    .insertOne(activity)
    .then((r) => r.ops[0]);
};

export const deleteActivity = async (db: Db, id: ObjectId | string) => {
  return db
    .collection<ActivityDB>(collection)
    .deleteOne({ _id: new ObjectId(id) });
};
