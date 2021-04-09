import { connectToDatabase } from "@db";
import { makeGetResultForSession } from "db/activitySessions";
import { connect } from "middlewares/connect";

const nc = connect();

nc.get(async (req, res) => {
  const { db } = await connectToDatabase();
  const session = req.cookies.activitySession;
  const getResult = makeGetResultForSession(db, session);
  const result = await getResult();

  return res.json({
    result,
  });
});

export default nc;
