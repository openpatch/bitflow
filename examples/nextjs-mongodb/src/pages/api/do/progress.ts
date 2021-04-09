import { connectToDatabase } from "@db";
import { makeGetProgressForSession } from "db/activitySessions";
import { connect } from "middlewares/connect";

const nc = connect();

nc.post(async (req, res) => {
  const { db } = await connectToDatabase();
  const session = req.cookies.activitySession;
  const getProgress = makeGetProgressForSession(db, session);
  const progress = await getProgress();

  return res.json({
    progress,
  });
});

export default nc;
