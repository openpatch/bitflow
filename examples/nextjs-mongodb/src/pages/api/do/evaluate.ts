import { connectToDatabase } from "@db";
import { setCookie } from "@utils/cookie";
import { makeEvaluateForSession } from "db/activitySessions";
import { connect } from "middlewares/connect";
import * as z from "zod";

const nc = connect();

const postBodySchema = z.object({
  answer: z.any(),
});

nc.post(async (req, res) => {
  const { db } = await connectToDatabase();
  const session = req.cookies.activitySession;
  const body = postBodySchema.parse(req.body);

  const evaluate = makeEvaluateForSession(db, session);

  const taskResult = await evaluate(body.answer);

  setCookie(res, "session", session);

  return res.json({
    result: taskResult,
  });
});

export default nc;
