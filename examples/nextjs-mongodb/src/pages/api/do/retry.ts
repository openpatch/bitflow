import { connectToDatabase } from "@db";
import { makeOnRetryForSession } from "db/activitySessions";
import { connect } from "middlewares/connect";

const nc = connect();

nc.get(async (req, res) => {
  const { db } = await connectToDatabase();
  const session = req.cookies.activitySession;
  const onRetry = makeOnRetryForSession(db, session);
  await onRetry();

  return res.json({});
});

export default nc;
