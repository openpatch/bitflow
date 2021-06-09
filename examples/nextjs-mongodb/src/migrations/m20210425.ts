import { ObjectId } from "mongodb";
import { connectToDatabase } from "./db";

const title = "move path to separate collection";

async function up() {
  const { client, db } = await connectToDatabase();
  const sessions = await db
    .collection<{
      _id: ObjectId;
      activityId: ObjectId;
      path: {
        startDate: Date;
      }[];
    }>("activitySessions")
    .find()
    .toArray();

  for (let session of sessions) {
    const path = session.path;
    for (let p of path) {
      const time = p.startDate.getTime() / 1000;
      await db.collection("activitySessionPaths").insertOne({
        _id: new ObjectId(time),
        activitySessionId: session._id,
        activityId: session.activityId,
        ...p,
      });
    }
  }
  client.close();
}

async function down() {}

export default {
  up,
  down,
  title,
};
