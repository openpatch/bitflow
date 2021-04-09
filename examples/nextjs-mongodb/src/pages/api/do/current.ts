import { extractPublicNode } from "@bitflow/flow";
import { connectToDatabase } from "@db";
import { makeGetCurrentNodeForSession } from "db/activitySessions";
import { connect } from "middlewares/connect";

const nc = connect();

nc.get(async (req, res) => {
  const { db } = await connectToDatabase();
  const session = req.cookies.activitySession;
  const getCurrentNode = makeGetCurrentNodeForSession(db, session);
  const currentNode = await getCurrentNode();

  return res.json({
    node: extractPublicNode(currentNode as any),
  });
});

export default nc;
