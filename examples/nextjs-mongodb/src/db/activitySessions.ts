import { TaskAnswer, TaskResult } from "@bitflow/base";
import { taskBits } from "@bitflow/bits";
import {
  FlowDoProps,
  FlowProgress,
  FlowResult,
  GetAnswers,
  GetPoints,
  GetResults,
  next,
  previous,
} from "@bitflow/flow";
import { ActivitySessionDB } from "@schemas/activitySession";
import { ObjectId } from "bson";
import { Db } from "mongodb";
import { findActivityById } from "./activities";

export const getCollection = (db: Db) => {
  return db.collection<ActivitySessionDB>("activitySessions");
};

export const findSessionById = async (db: Db, sessionId: string) => {
  const session = await getCollection(db).findOne({
    _id: new ObjectId(sessionId),
  });

  if (!session) {
    throw new Error("Session not found");
  }

  return session;
};

export const startSession = async (
  db: Db,
  activityId: ObjectId | string
): Promise<string> => {
  const activity = await findActivityById(db, new ObjectId(activityId));

  if (!activity) {
    throw new Error("Activity not found");
  }

  const startNode = activity.flow.nodes.find((n) => n.type === "start");

  if (!startNode) {
    throw new Error("Start node not found");
  }

  return db
    .collection<Omit<ActivitySessionDB, "_id">>("activitySessions")
    .insertOne({
      activityId: new ObjectId(activityId),
      path: [startNode.id],
      startDate: new Date(),
      points: 0,
      submissions: {},
    })
    .then((session) => session.insertedId.toHexString());
};

export const makeGetAnswersForSession = (
  db: Db,
  sessionId: string
): GetAnswers => async (nodeIds) => {
  const session = await findSessionById(db, sessionId);

  const answers: Record<string, TaskAnswer> = {};
  Object.entries(session.submissions).forEach(([nodeId, submission]) => {
    if (nodeIds.includes(nodeId)) {
      answers[nodeId] = submission[submission.length - 1].answer;
    }
  });

  return answers;
};

export const makeGetResultsForSession = (
  db: Db,
  sessionId: string
): GetResults => async (nodeIds) => {
  const session = await findSessionById(db, sessionId);

  const results: Record<string, TaskResult> = {};
  Object.entries(session.submissions).forEach(([nodeId, submission]) => {
    if (nodeIds.includes(nodeId)) {
      results[nodeId] = submission[submission.length - 1].result;
    }
  });

  return results;
};

export const makeGetPointsForSession = (
  db: Db,
  sessionId: string
): GetPoints => async () => {
  const session = await findSessionById(db, sessionId);

  return session.points;
};

export const makeGetCurrentNodeForSession = (
  db: Db,
  sessionId: string
): FlowDoProps["getCurrent"] => async () => {
  const session = await findSessionById(db, sessionId);
  const activity = await findActivityById(db, session.activityId);

  if (!activity) {
    throw new Error("Activity not found");
  }

  const currentNodeId = session.path[session.path.length - 1];
  const currentNode = activity.flow.nodes.find((n) => n.id === currentNodeId);

  if (!currentNode) {
    throw new Error("Current node not found");
  }

  return currentNode;
};

export const makeGetNextNodeForSession = (
  db: Db,
  sessionId: string
): FlowDoProps["getNext"] => async () => {
  const session = await findSessionById(db, sessionId);
  const activity = await findActivityById(db, session.activityId);

  if (!activity) {
    throw new Error("Activity not found");
  }

  const currentNodeId = session.path[session.path.length - 1];
  const getAnswers = makeGetAnswersForSession(db, sessionId);
  const getResults = makeGetResultsForSession(db, sessionId);
  const getPoints = makeGetPointsForSession(db, sessionId);

  const nextNode = await next({
    currentId: currentNodeId,
    nodes: activity.flow.nodes,
    edges: activity.flow.edges,
    getAnswers,
    getPoints,
    getResults,
  });

  if (nextNode !== null) {
    await getCollection(db).updateOne(
      { _id: session._id },
      {
        $push: { path: nextNode.id },
      }
    );
  }

  return nextNode;
};

export const makeGetPreviousNodeForSession = (
  db: Db,
  sessionId: string
): FlowDoProps["getPrevious"] => async () => {
  const session = await findSessionById(db, sessionId);
  const activity = await findActivityById(db, session.activityId);

  if (!activity) {
    throw new Error("Activity not found");
  }

  const currentNodeId = session.path[session.path.length - 1];

  const previousNode = await previous({
    currentId: currentNodeId,
    nodes: activity.flow.nodes,
    edges: activity.flow.edges,
  });

  if (previousNode !== null) {
    await getCollection(db).updateOne(
      { _id: session._id },
      { $push: { path: previousNode.id } }
    );
  }

  return previousNode;
};

export const makeGetProgressForSession = (
  db: Db,
  sessionId: string
): FlowDoProps["getProgress"] => async () => {
  const session = await findSessionById(db, sessionId);
  const activity = await findActivityById(db, session.activityId);

  if (!activity) {
    throw new Error("Activity not found");
  }

  const currentNodeId = session.path[session.path.length - 1];
  const currentNode = activity.flow.nodes.find((n) => n.id === currentNodeId);

  if (!currentNode) {
    throw new Error("Current node not found");
  }

  const nodeConfig = activity.flowState.nodes[currentNodeId];

  let nextNodeState: FlowProgress["nextNodeState"] = "unlocked";

  if (currentNode.type === "synchronize") {
    nextNodeState = nodeConfig?.state || "locked";
  }

  const progess: FlowProgress = {
    currentNodeIndex: 0,
    estimatedNodes: 0,
    nextNodeState,
  };

  return progess;
};

export const makeGetResultForSession = (
  db: Db,
  sessionId: string
): FlowDoProps["getResult"] => async () => {
  const session = await findSessionById(db, sessionId);

  const result: FlowResult = {
    path: session.path,
    points: session.points,
    submissions: session.submissions,
  };

  return result;
};

export const makeEvaluateForSession = (
  db: Db,
  sessionId: string
): ((answer: TaskAnswer) => Promise<TaskResult>) => async (answer) => {
  const session = await findSessionById(db, sessionId);
  const activity = await findActivityById(db, session.activityId);

  if (!activity) {
    throw new Error("Activity not found");
  }

  const currentNodeId = session.path[session.path.length - 1];
  const currentNode = activity.flow.nodes.find((n) => n.id === currentNodeId);

  if (!currentNode) {
    throw new Error("Current node not found");
  }

  let taskResult: TaskResult = {
    state: "unknown",
  };

  if (currentNode.type === "task") {
    try {
      const taskBit = taskBits[currentNode.data.subtype];
      taskResult = await taskBit.evaluate({
        answer,
        task: currentNode.data,
      });
    } catch (e) {
      console.error("Error when evaluating task", e);
    }
  }

  const submission = {
    result: taskResult,
    answer,
  };

  if (!session.submissions[currentNodeId]) {
    session.submissions[currentNodeId] = [submission];

    if (taskResult.state === "correct") {
      session.points += 1;
    }
  } else {
    const lastSubmission =
      session.submissions[currentNodeId][
        session.submissions[currentNodeId].length - 1
      ];
    session.submissions[currentNodeId].push(submission);

    if (
      lastSubmission.result.state === "correct" &&
      taskResult.state !== "correct"
    ) {
      session.points -= 1;
    } else if (
      lastSubmission.result.state !== "correct" &&
      taskResult.state === "correct"
    ) {
      session.points += 1;
    }
  }

  await getCollection(db).replaceOne({ _id: session._id }, session);

  return taskResult;
};

export const makeOnEndForSession = (
  db: Db,
  sessionId: string
): FlowDoProps["onEnd"] => async () => {
  return getCollection(db).updateOne(
    { _id: new ObjectId(sessionId) },
    {
      endDate: new Date(),
    }
  );
};

export const makeOnSkipForSession = (
  db: Db,
  sessionId: string
): FlowDoProps["onSkip"] => async () => {
  const session = await findSessionById(db, sessionId);
};
