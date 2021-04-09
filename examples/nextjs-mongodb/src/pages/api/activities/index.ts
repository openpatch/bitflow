import { connectToDatabase } from "@db";
import { ActivitySchema } from "@schemas/activity";
import { createActivity, findActivities } from "db/activities";
import { auth } from "middlewares/auth";
import { connect } from "middlewares/connect";
import { NextApiRequest, NextApiResponse } from "next";

const handler = connect();

const postSchema = ActivitySchema.omit({ _id: true });

handler
  .use(auth)
  .get<NextApiRequest & Express.Request, NextApiResponse>(async (req, res) => {
    if (!req.user) {
      return null;
    }
    const { db } = await connectToDatabase();
    const activities = await findActivities(db);
    return res.json({
      activities,
    });
  })
  .post<NextApiRequest & Express.Request, NextApiResponse>(async (req, res) => {
    if (!req.user) {
      return null;
    }
    const result = postSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({
        errors: result.error.errors,
      });
    }

    const { db } = await connectToDatabase();
    const newActivity = await createActivity(db, result.data);

    return res.json({
      activity: newActivity,
    });
  });

export default handler;
