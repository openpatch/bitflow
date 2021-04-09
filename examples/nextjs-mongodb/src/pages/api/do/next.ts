import { connectToDatabase } from "@db";
import { makeGetNextNodeForSession } from "db/activitySessions";
import { connect } from "middlewares/connect";

const nc = connect();

nc.get(async (req, res) => {
  const { db } = await connectToDatabase();
  const session = req.cookies.activitySession;
  const getNextNode = makeGetNextNodeForSession(db, session);
  const nextNode = await getNextNode();

  return res.json({
    node: nextNode,
  });
});

export default nc;
