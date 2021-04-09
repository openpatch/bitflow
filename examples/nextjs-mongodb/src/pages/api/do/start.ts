import { connectToDatabase } from "@db";
import { setCookie } from "@utils/cookie";
import { startSession } from "db/activitySessions";
import { connect } from "middlewares/connect";
import * as z from "zod";

const nc = connect();

const postBodySchema = z.object({
  activityId: z.string(),
});

nc.post(async (req, res) => {
  const { db } = await connectToDatabase();
  const body = postBodySchema.parse(req.body);
  const sessionId = await startSession(db, body.activityId);

  setCookie(res, "activitySession", sessionId);

  return res.json({
    session: sessionId,
  });
});

export default nc;
