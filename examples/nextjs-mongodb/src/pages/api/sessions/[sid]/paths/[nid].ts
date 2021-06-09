import { connectToDatabase } from "@db";
import { auth } from "@middlewares/auth";
import { connect } from "@middlewares/connect";
import {
  findFirstFinishedPathForSessionAndNodeId,
  findLastFinishedPathForSessionAndNodeId,
} from "db/activitySessionPaths";
import { NextApiRequest, NextApiResponse } from "next";

const handler = connect();

handler
  .use(auth)
  .get<NextApiRequest & Express.Request, NextApiResponse>(async (req, res) => {
    if (!req.user) {
      return null;
    }

    const { db } = await connectToDatabase();

    const { sid, nid } = req.query;
    let { mode } = req.query;

    if (typeof sid !== "string") {
      return res.status(400).json({
        error: "Session id in wrong format",
      });
    }

    if (typeof nid !== "string") {
      return res.status(400).json({
        error: "Node id in wrong format",
      });
    }

    if (typeof mode !== "string") {
      mode = "first";
    } else if (mode !== "first" && mode !== "last") {
      mode = "last";
    }

    if (mode === "first") {
      const path = await findFirstFinishedPathForSessionAndNodeId(db, sid, nid);
      return res.status(200).json({
        path,
      });
    } else {
      const path = await findLastFinishedPathForSessionAndNodeId(db, sid, nid);
      return res.status(200).json({
        path,
      });
    }
  });

export default handler;
