import { taskBits } from "@bitflow/bits";
import {
  convertMapToTable,
  cronbachsAlpha,
  omitTableRows,
  pearsonsCorrelation,
  summary,
} from "@bitflow/stats";
import { Activity, ActivityDB } from "@schemas/activity";
import { ActivityReportDB, Try } from "@schemas/activityReport";
import { ActivitySessionPathDB } from "@schemas/activitySessionPath";
import { ObjectId } from "bson";
import { Db } from "mongodb";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { findActivityById } from "./activities";

const collection = "activityReports";

export const findActivityReportForId = async (
  db: Db,
  activityId: string | ObjectId
) => {
  const report = await db.collection<ActivityReportDB>(collection).findOne({
    activityId: new ObjectId(activityId),
  });

  if (!report) {
    return createActivityReportForId(db, activityId);
  } else {
    return updateActivityReportForId(db, report);
  }
};

export const createActivityReportForId = async (
  db: Db,
  activityId: string | ObjectId
) => {
  const { ops } = await db.collection<ActivityReportDB>(collection).insertOne({
    _id: new ObjectId(),
    activityId: new ObjectId(activityId),
    started: 0,
    ended: 0,
    tries: {
      first: {
        model: {
          latentVariables: {},
        },
        correlation: [],
        tasks: {},
        nodes: {},
        time: 0,
        overall: {
          n: 0,
          rawScores: {},
          potentialScores: {},
          mean: 0,
          median: 0,
          max: 0,
          min: 0,
          lowerQuartile: 0,
          upperQuartile: 0,
          standardDeviation: 0,
          variance: 0,
        },
      },
      partial: {
        model: {
          latentVariables: {},
        },
        correlation: [],
        time: 0,
        tries: 0,
        tasks: {},
        nodes: {},
        overall: {
          n: 0,
          rawScores: {},
          potentialScores: {},
          mean: 0,
          median: 0,
          max: 0,
          min: 0,
          lowerQuartile: 0,
          upperQuartile: 0,
          standardDeviation: 0,
          variance: 0,
        },
      },
      last: {
        model: {
          latentVariables: {},
        },
        correlation: [],
        time: 0,
        tries: 0,
        tasks: {},
        nodes: {},
        overall: {
          n: 0,
          rawScores: {},
          potentialScores: {},
          mean: 0,
          median: 0,
          max: 0,
          min: 0,
          lowerQuartile: 0,
          upperQuartile: 0,
          standardDeviation: 0,
          variance: 0,
        },
      },
    },
    usernames: {},
  });
  const report = ops[0];

  return updateActivityReportForId(db, report);
};

export const updateActivityReportForId = async (
  db: Db,
  report: ActivityReportDB
) => {
  const activity = await findActivityById(db, report.activityId);
  if (!activity) {
    throw new Error("Activity not found!");
  }
  const cursor = db
    .collection<ActivitySessionPathDB>("activitySessionPaths")
    .find(
      report.lastUpdate
        ? {
            $or: [
              {
                startDate: {
                  $gt: report.lastUpdate,
                },
              },
              {
                endDate: {
                  $gt: report.lastUpdate,
                },
              },
            ],
            activityId: report.activityId,
          }
        : {
            activityId: report.activityId,
          }
    );

  let lastUpdate = report.lastUpdate;

  for await (const path of cursor) {
    // count started sessions
    if (!report.usernames[path.activitySessionId.toHexString()]) {
      const randomName = uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
        separator: " ",
        seed: path.activitySessionId.getTimestamp().getTime(),
        style: "capital",
      });
      report.usernames[path.activitySessionId.toHexString()] = randomName;
    }
    if (path.try === 0 && path.node.type === "start") {
      report.started += 1;
    }
    if (path.try === 0 && path.node.type === "end") {
      report.ended += 1;
    }

    let currTry = report.tries.last;

    await reportTry(path, activity, currTry);

    if (path.try === 0) {
      await reportTry(path, activity, report.tries.first);
    }
    lastUpdate = path.startDate;
    if (path.status !== "started") {
      lastUpdate = path.endDate;
    }
  }

  // update only if a new path was added
  if (report.lastUpdate !== lastUpdate) {
    summarizeTry(report.tries.first);
    calculateModel(report.tries.first, activity.model);
    summarizeTry(report.tries.last);
    calculateModel(report.tries.last, activity.model);
    report.tries.partial = JSON.parse(JSON.stringify(report.tries.last));
    summarizeTry(report.tries.partial, {
      calcScore: (rawState) =>
        Math.max(
          0,
          rawState.state === "correct" ? 1 - rawState.tries * 0.2 : 0
        ),
    });
    calculateModel(report.tries.partial, activity.model);
  }

  const newReport = {
    ...report,
    lastUpdate,
  };

  await db.collection<ActivityReportDB>(collection).replaceOne(
    {
      _id: report._id,
    },
    newReport
  );

  return newReport;
};

const reportTry = async (
  path: ActivitySessionPathDB,
  activity: ActivityDB,
  currTry: Try
) => {
  let reportNode = currTry.nodes[path.node.id];
  if (!reportNode) {
    reportNode = {
      time: 0,
      n: 0,
      rawStatus: {},
      status: {
        finished: 0,
        skipped: 0,
        started: 0,
      },
    };
    currTry.nodes[path.node.id] = reportNode;
  }

  reportNode.rawStatus[path.activitySessionId.toHexString()] = {
    status: path.status,
    tries: path.try + 1,
  };

  if (path.status === "finished" || path.status === "skipped") {
    // time
    const endDate = path.endDate || path.startDate;
    const time = (endDate.getTime() - path.startDate.getTime()) / 1000;
    currTry.nodes[path.node.id].time += time;
    currTry.time += time;
  }
  if (path.node.type === "task" && path.status === "finished") {
    const activityNode = activity.flow.nodes.find((n) => n.id === path.node.id);
    if (!activityNode || activityNode.type !== "task") {
      return;
    }
    const sessionId = path.activitySessionId.toHexString();
    const { answer, result } = path;
    const { updateStatistic } = taskBits[activityNode.data.subtype];
    if (!currTry.tasks[activityNode.id]) {
      currTry.tasks[activityNode.id] = {
        n: 0,
        lowerQuartile: 0,
        max: 0,
        mean: 0,
        median: 0,
        min: 0,
        difficulty: 0,
        discriminationIndex: 0,
        rawStates: {},
        rawScores: {},
        potentialScores: {},
        upperQuartile: 0,
        standardDeviation: 0,
        variance: 0,
        states: {
          correct: 0,
          manual: 0,
          unknown: 0,
          wrong: 0,
        },
      };
    }
    try {
      const state = result?.state || "unknown";
      if (!currTry.tasks[activityNode.id].rawStates[sessionId]) {
        currTry.tasks[activityNode.id].rawStates[sessionId] = {
          state,
          tries: 0,
        };
      }
      currTry.tasks[activityNode.id].rawStates[sessionId] = {
        state,
        tries: path.try + 1,
      };

      const statistic = await updateStatistic({
        answer,
        result,
        task: activityNode.data,
        statistic: currTry.tasks[activityNode.id].statistic,
      });
      currTry.tasks[activityNode.id].statistic = statistic;
    } catch (e) {
      console.error(e);
    }
  }
  return currTry;
};

// should be called after summarizeTry
const calculateModel = (currTry: Try, model: Activity["model"]) => {
  for (const lv of model.latentVariables) {
    const id = lv.id;
    const connectedTaskIds = model.edges
      .filter((e) => e.target === id)
      .map((e) => e.source);
    const scoreMap: Record<string, Record<string, number>> = {};
    const rawScores: Record<string, number> = {};
    const potentialScores: Record<string, number> = {};
    for (const cTId of connectedTaskIds) {
      for (const session of Object.keys(currTry.tasks[cTId]?.rawScores || {})) {
        const rawScore = currTry.tasks[cTId].rawScores[session];
        const potentialScore = currTry.tasks[cTId].potentialScores[session];
        if (!scoreMap[session]) {
          scoreMap[session] = {};
        }
        scoreMap[session][cTId] = rawScore;
        if (!rawScores[session]) {
          rawScores[session] = 0;
        }
        if (!potentialScores[session]) {
          potentialScores[session] = 0;
        }
        potentialScores[session] += potentialScore;
        rawScores[session] += rawScore;
      }
    }
    const taskScoreTable = convertMapToTable(scoreMap);
    const cells = omitTableRows(taskScoreTable).cells;
    let a = 0;
    try {
      a = cronbachsAlpha(cells);
    } catch (e) {}
    const s = summary(Object.values(rawScores));

    currTry.model.latentVariables[id] = {
      alpha: a,
      n: Object.values(rawScores).length,
      ...s,
      rawScores,
      potentialScores,
    };
  }
};

type SummarizeTryOptions = {
  calcScore: (rawState: Try["tasks"]["0"]["rawStates"]["0"]) => number;
};

const summarizeTry = (
  currTry: Try,
  options: SummarizeTryOptions = {
    calcScore: (rawState) => (rawState.state === "correct" ? 1 : 0),
  }
) => {
  // calculate latest status
  Object.entries(currTry.nodes).forEach(([_, node]) => {
    const status = Object.values(node.rawStatus).reduce(
      (acc, s) => {
        acc[s.status] += 1;
        return acc;
      },
      {
        started: 0,
        finished: 0,
        skipped: 0,
      }
    );
    node.status = status;
    node.n = Object.values(node.rawStatus).length;
  });

  // calculate overall rawScores
  currTry.overall.rawScores = {};
  Object.entries(currTry.tasks).forEach(([taskKey, task]) => {
    Object.entries(task.rawStates).forEach(([sessionKey, state]) => {
      if (!currTry.overall.rawScores[sessionKey]) {
        currTry.overall.rawScores[sessionKey] = 0;
      }
      const score = options.calcScore(state);
      task.rawScores[sessionKey] = score;
      if (state.state !== "unknown") {
        task.potentialScores[sessionKey] = 1;
        currTry.overall.potentialScores[sessionKey] += 1;
      }
      currTry.overall.rawScores[sessionKey] += score;
    });
    // difficulty
    task.difficulty =
      Object.values(task.rawScores).reduce((acc, s) => acc + s, 0) /
      Object.values(task.rawScores).length;

    // summary for task
    const s = summary(Object.values(task.rawScores));
    task.n = Object.values(currTry.nodes[taskKey].rawStatus).length;
    task.max = s.max;
    task.mean = s.mean;
    task.median = s.median;
    task.min = s.min;
    task.standardDeviation = s.standardDeviation;
    task.variance = s.variance;
    task.upperQuartile = s.upperQuartile;
    task.lowerQuartile = s.lowerQuartile;
    task.states = Object.values(task.rawStates).reduce(
      (acc, s) => {
        acc[s.state] += 1;
        return acc;
      },
      {
        correct: 0,
        wrong: 0,
        unknown: 0,
        manual: 0,
      }
    );
  });

  // summary for overall
  const s = summary(Object.values(currTry.overall.rawScores));
  currTry.overall.n = Object.values(currTry.overall.rawScores).length;
  currTry.overall.max = s.max;
  currTry.overall.mean = s.mean;
  currTry.overall.median = s.median;
  currTry.overall.min = s.min;
  currTry.overall.standardDeviation = s.standardDeviation;
  currTry.overall.variance = s.variance;
  currTry.overall.upperQuartile = s.upperQuartile;
  currTry.overall.lowerQuartile = s.lowerQuartile;

  // discrimination index
  const rawScores = Object.entries(currTry.overall.rawScores).sort(
    ([k1, v1], [k2, v2]) => (v1 > v2 ? 1 : -1)
  );
  const groupSize = Math.floor(rawScores.length * 0.25);
  const lowGroup: string[] = rawScores
    .slice(0, groupSize)
    .map(([key, value]) => key);
  const highGroup: string[] = rawScores
    .slice(rawScores.length - groupSize)
    .map(([key, value]) => key);

  Object.values(currTry.tasks).forEach((task) => {
    const hasCorrect = Object.entries(task.rawScores)
      .filter(([k, v]) => v === 1)
      .map(([k]) => k);
    const lowGroupCount = lowGroup.filter((s) => hasCorrect.includes(s)).length;
    const highGroupCount = highGroup.filter((s) =>
      hasCorrect.includes(s)
    ).length;

    task.discriminationIndex = (highGroupCount - lowGroupCount) / groupSize;
  });

  // correlation
  const nodeIds = Object.keys(currTry.tasks);
  currTry.correlation = nodeIds.flatMap((node1, i) =>
    nodeIds.slice(i + 1).map((node2) => {
      const node1Sessions = Object.keys(currTry.tasks[node1].rawStates);
      const node2Sessions = Object.keys(currTry.tasks[node2].rawStates);
      const commonSessions = node1Sessions.filter((n) =>
        node2Sessions.includes(n)
      );
      const node1ResultVector = Object.entries(currTry.tasks[node1].rawStates)
        .filter(([key]) => commonSessions.includes(key))
        .sort(([keya], [keyb]) => (keya > keyb ? 1 : -1))
        .map(([_, value]) => options.calcScore(value));
      const node2ResultVector = Object.entries(currTry.tasks[node2].rawStates)
        .filter(([key]) => commonSessions.includes(key))
        .sort(([keya], [keyb]) => (keya > keyb ? 1 : -1))
        .map(([_, value]) => options.calcScore(value));

      const pearson = pearsonsCorrelation(node1ResultVector, node2ResultVector);

      return { node1, node2, pearson };
    })
  );
};
