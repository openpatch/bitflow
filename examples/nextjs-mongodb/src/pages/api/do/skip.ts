import { connectToDatabase } from "@db";
import { makeOnSkipForSession } from "db/activitySessions";
import { connect } from "middlewares/connect";

const nc = connect();

nc.get(async (req, res) => {
  const { db } = await connectToDatabase();
  const session = req.cookies.activitySession;
  const onSkip = makeOnSkipForSession(db, session);
  onSkip();

  return res.json({});
});

export default nc;
