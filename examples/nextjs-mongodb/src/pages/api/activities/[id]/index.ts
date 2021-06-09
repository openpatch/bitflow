import { connectToDatabase } from "@db";
import { ActivitySchema } from "@schemas/activity";
import {
  deleteActivity,
  findActivityById,
  updateActivity,
} from "db/activities";
import { auth } from "middlewares/auth";
import { connect } from "middlewares/connect";
import { NextApiRequest, NextApiResponse } from "next";

const handler = connect();

const putSchema = ActivitySchema.partial().omit({ _id: true });

handler
  .use(auth)
  .get<NextApiRequest & Express.Request, NextApiResponse>(async (req, res) => {
    if (!req.user) {
      return null;
    }
    const { id } = req.query;
    if (typeof id !== "string") {
      return res.status(400).json({
        error: "Id in wrong format",
      });
    }
    const { db } = await connectToDatabase();
    const activity = await findActivityById(db, id);
    return res.json({
      activity,
    });
  })
  .put<NextApiRequest & Express.Request, NextApiResponse>(async (req, res) => {
    if (!req.user) {
      return null;
    }
    const { id } = req.query;
    if (typeof id !== "string") {
      return res.status(400).json({
        error: "Id in wrong format",
      });
    }
    const result = putSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({
        errors: result.error.errors,
      });
    }

    const { db } = await connectToDatabase();
    await updateActivity(db, id, result.data);

    return res.json({});
  })
  .delete<NextApiRequest & Express.Request, NextApiResponse>(
    async (req, res) => {
      if (!req.user) {
        return null;
      }
      const { id } = req.query;
      if (typeof id !== "string") {
        return res.status(400).json({
          error: "Id in wrong format",
        });
      }

      const { db } = await connectToDatabase();
      await deleteActivity(db, id);

      return res.json({});
    }
  );

export default handler;
