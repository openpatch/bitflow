import { connectToDatabase } from "@db";
import { auth } from "@middlewares/auth";
import { connect } from "@middlewares/connect";
import { findActivityReportForId } from "db/activityReports";
import { NextApiRequest, NextApiResponse } from "next";

const handler = connect();

const filterObject = (object: any, excludeKeys: string[]) => {
  const keys = Object.keys(object);
  for (const key of keys) {
    if (excludeKeys.includes(key)) {
      delete object[key];
    } else {
      const value = object[key];
      if (typeof value === "object") {
        filterObject(value, excludeKeys);
      } else if (Array.isArray(value)) {
        value.forEach((v) => filterObject(v, excludeKeys));
      }
    }
  }
};

handler
  .use(auth)
  .get<NextApiRequest & Express.Request, NextApiResponse>(async (req, res) => {
    if (!req.user) {
      return res.status(403).json({});
    }
    const { id } = req.query;
    if (typeof id !== "string") {
      return res.status(400).json({
        error: "Id in wrong format",
      });
    }

    const { db } = await connectToDatabase();
    const report = await findActivityReportForId(db, id);

    return res.status(200).json({
      report,
    });
  });

export default handler;
