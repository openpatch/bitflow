import { TaskAnswer, TaskResult } from "@bitflow/base";
import { ActivitySessionPathDB } from "@schemas/activitySessionPath";
import { ObjectId } from "bson";
import { Db } from "mongodb";
const collection = "activitySessionPaths";

export const getCollection = (db: Db) => {
  return db.collection<ActivitySessionPathDB>(collection);
};

export const insertActivitySessionPathForSession = (
  db: Db,
  sessionId: string | ObjectId,
  activityId: string | ObjectId,
  node: ActivitySessionPathDB["node"],
  tries: number = 0
) => {
  return getCollection(db).insertOne({
    status: "started",
    startDate: new Date(),
    activitySessionId: new ObjectId(sessionId),
    activityId: new ObjectId(activityId),
    node,
    try: tries,
    _id: new ObjectId(),
  });
};

export const findLastFinishedPathForSessionAndNodeId = async (
  db: Db,
  sessionId: string | ObjectId,
  nodeId: string
) => {
  return db
    .collection<
      ActivitySessionPathDB & { status: "finished"; result: TaskResult }
    >(collection)
    .find({
      status: "finished",
      activitySessionId: new ObjectId(sessionId),
      "node.id": nodeId,
    })
    .next();
};

export const findFirstFinishedPathForSessionAndNodeId = async (
  db: Db,
  sessionId: string | ObjectId,
  nodeId: string
) => {
  return db
    .collection<
      ActivitySessionPathDB & { status: "finished"; result: TaskResult }
    >(collection)
    .find({
      status: "finished",
      activitySessionId: new ObjectId(sessionId),
      "node.id": nodeId,
      try: 0,
    })
    .next();
};

export const skipCurrentActivitySessionPathForSession = async (
  db: Db,
  sessionId: string | ObjectId
) => {
  const current = await findCurrentActivitySessionPathForSession(db, sessionId);
  if (!current) {
    return null;
  }

  return getCollection(db).updateOne(
    {
      _id: current._id,
    },
    {
      $set: {
        status: "skipped",
        endDate: new Date(),
      },
    }
  );
};

export const finishCurrentActivitySessionPathForSession = async (
  db: Db,
  sessionId: string | ObjectId,
  answer?: TaskAnswer,
  result?: TaskResult
) => {
  const current = await findCurrentActivitySessionPathForSession(db, sessionId);
  if (!current) {
    return null;
  }

  return getCollection(db).updateOne(
    {
      _id: current._id,
    },
    {
      $set: {
        status: "finished",
        endDate: new Date(),
        answer,
        result,
      },
    }
  );
};

export const findFinishedActivitySessionPathForSession = (
  db: Db,
  sessionId: string | ObjectId
) => {
  return getCollection(db).find({
    activitySessionId: new ObjectId(sessionId),
    status: "finished",
  });
};

export const findCurrentActivitySessionPathForSession = (
  db: Db,
  sessionId: string | ObjectId
) => {
  return getCollection(db)
    .find({ activitySessionId: new ObjectId(sessionId) })
    .sort({ $natural: -1 })
    .limit(1)
    .next();
};

export const findPreviousActivitySessionPathForSession = (
  db: Db,
  sessionId: string | ObjectId,
  nodeId: string
) => {
  return getCollection(db)
    .find({
      activitySessionId: new ObjectId(sessionId),
      "node.id": nodeId,
    })
    .sort({ $natural: -1 })
    .limit(1)
    .next();
};

export const findActivitySessionPathForSession = (
  db: Db,
  sessionId: string | ObjectId
) => {
  return getCollection(db).find({
    activitySessionId: new ObjectId(sessionId),
  });
};
