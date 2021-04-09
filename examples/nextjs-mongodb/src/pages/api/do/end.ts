import { connectToDatabase } from "@db";
import { makeOnEndForSession } from "db/activitySessions";
import { connect } from "middlewares/connect";

const nc = connect();

nc.get(async (req, res) => {
  const { db } = await connectToDatabase();
  const session = req.cookies.activitySession;
  const onEnd = makeOnEndForSession(db, session);
  onEnd();

  return res.json({});
});

export default nc;
