import { connectToDatabase } from "@db";
import { makeGetPreviousNodeForSession } from "db/activitySessions";
import { connect } from "middlewares/connect";

const nc = connect();

nc.post(async (req, res) => {
  const { db } = await connectToDatabase();
  const session = req.cookies.activitySession;
  const getPreviousNode = makeGetPreviousNodeForSession(db, session);
  const previousNode = await getPreviousNode();

  return res.json({
    node: previousNode,
  });
});

export default nc;
