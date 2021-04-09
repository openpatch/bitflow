import { findLast, TaskAnswer, TaskResult } from "@bitflow/base";
import { taskBits } from "@bitflow/bits";
import {
  extractPublicNode,
  FlowDoProps,
  FlowProgress,
  FlowResult,
  FlowResultPathEntry,
  GetAnswers,
  GetPoints,
  GetResults,
  IFlowNode,
  next,
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

  const startNode = activity.flow.nodes.find(
    (n) => n.type === "start"
  ) as IFlowNode & { type: "start" };

  if (!startNode) {
    throw new Error("Start node not found");
  }

  return db
    .collection<ActivitySessionDB>("activitySessions")
    .insertOne({
      _id: new ObjectId(),
      activityId: new ObjectId(activityId),
      path: [
        {
          status: "started",
          try: 0,
          node: extractPublicNode(startNode),
          startDate: new Date(),
        },
      ],
      currentNodeIndex: 0,
      startDate: new Date(),
      points: 0,
    })
    .then((session) => session.insertedId.toHexString());
};

export const makeGetAnswersForSession = (
  db: Db,
  sessionId: string
): GetAnswers => async (nodeIds) => {
  const session = await findSessionById(db, sessionId);

  const answers: Record<string, TaskAnswer> = {};

  session.path.forEach((p) => {
    if (p.status === "finished") {
      answers[p.node.id] = p.answer;
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

  session.path.forEach((p) => {
    if (p.status === "finished") {
      results[p.node.id] = p.result;
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

  const currentPath = session.path[session.path.length - 1];
  const currentNode = activity.flow.nodes.find(
    (n) => n.id === currentPath.node.id
  );

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

  const currentPath = session.path[session.path.length - 1];
  const getAnswers = makeGetAnswersForSession(db, sessionId);
  const getResults = makeGetResultsForSession(db, sessionId);
  const getPoints = makeGetPointsForSession(db, sessionId);

  const nextNode = await next({
    currentId: currentPath.node.id,
    nodes: activity.flow.nodes,
    edges: activity.flow.edges,
    getAnswers,
    getPoints,
    getResults,
  });

  if (
    nextNode !== null &&
    (nextNode.type === "task" ||
      nextNode.type === "input" ||
      nextNode.type === "end" ||
      nextNode.type === "title" ||
      nextNode.type === "checkpoint" ||
      nextNode.type === "synchronize")
  ) {
    await getCollection(db).updateOne(
      { _id: session._id },
      {
        $push: {
          path: {
            status: "started",
            try: 0,
            startDate: new Date(),
            node: extractPublicNode(nextNode),
          },
        },
        $inc: { currentNodeIndex: 1 },
      }
    );
  }

  return nextNode;
};

export const makeGetPreviousNodeForSession = (
  db: Db,
  sessionId: string
): Required<FlowDoProps>["getPrevious"] => async () => {
  const session = await findSessionById(db, sessionId);
  const activity = await findActivityById(db, session.activityId);

  if (!activity) {
    throw new Error("Activity not found");
  }

  const currentPath = session.path[session.path.length - 1];
  const previousPath = findLast(
    session.path,
    (p) => p.node.id !== currentPath.node.id
  );
  if (!previousPath) {
    return null;
  }
  const previousNode =
    activity.flow.nodes.find((n) => n.id === previousPath.node.id) || null;

  if (
    previousNode !== null &&
    (previousNode.type === "start" ||
      previousNode.type === "task" ||
      previousNode.type === "input" ||
      previousNode.type === "title" ||
      previousNode.type === "checkpoint" ||
      previousNode.type === "synchronize")
  ) {
    await getCollection(db).updateOne(
      { _id: session._id },
      {
        $push: {
          path: {
            status: "started",
            try: previousPath.try + 1,
            node: extractPublicNode(previousNode),
            startDate: new Date(),
          },
        },
        $inc: { currentNodeIndex: -1 },
      }
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

  const currentPath = session.path[session.path.length - 1];
  const currentNode = currentPath.node;

  if (!currentNode) {
    throw new Error("Current node not found");
  }

  const nodeConfig = activity.flowState.nodes[currentNode.id];

  let nextNodeState: FlowProgress["nextNodeState"] = "unlocked";

  if (currentNode.type === "synchronize") {
    nextNodeState = nodeConfig?.state || "locked";
  }

  const progess: FlowProgress = {
    currentNodeIndex: session.currentNodeIndex,
    estimatedNodes:
      activity.flow.nodes.filter(
        (n) =>
          n.type === "task" ||
          n.type === "input" ||
          n.type === "start" ||
          n.type === "checkpoint" ||
          n.type === "synchronize" ||
          n.type === "title" ||
          n.type === "end"
      ).length - 1,
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

  const currentPath = session.path[session.path.length - 1];
  const currentNode = activity.flow.nodes.find(
    (n) => n.id === currentPath.node.id
  );

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

  const lastFinishedPath = findLast<FlowResultPathEntry>(
    session.path,
    (e) => e.status === "finished" && e.node.id === currentNode.id
  ) as FlowResultPathEntry & { status: "finished" };

  session.path[session.path.length - 1] = {
    ...currentPath,
    status: "finished",
    endDate: new Date(),
    answer,
    result: taskResult,
  };

  if (!lastFinishedPath && taskResult.state === "correct") {
    session.points += 1;
  } else if (
    lastFinishedPath &&
    lastFinishedPath.result.state === "correct" &&
    taskResult.state !== "correct"
  ) {
    session.points -= 1;
  } else if (
    lastFinishedPath &&
    lastFinishedPath.result.state !== "correct" &&
    taskResult.state === "correct"
  ) {
    session.points += 1;
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
  session.path[session.path.length - 1].status = "skipped";
  await getCollection(db).replaceOne({ _id: new ObjectId(sessionId) }, session);
};

export const makeOnRetryForSession = (
  db: Db,
  sessionId: string
): FlowDoProps["onSkip"] => async () => {
  const session = await findSessionById(db, sessionId);
  const lastPath = session.path[session.path.length - 1];
  await getCollection(db).updateOne(
    { _id: new ObjectId(sessionId) },
    {
      $push: {
        path: {
          status: "started",
          try: lastPath.try + 1,
          startDate: new Date(),
          node: lastPath.node,
        },
      },
    }
  );
};
