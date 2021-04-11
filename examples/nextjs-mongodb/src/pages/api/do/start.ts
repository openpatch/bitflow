import { connectToDatabase } from "@db";
import { setCookie } from "@utils/cookie";
import { ObjectId } from "bson";
import { startSession } from "db/activitySessions";
import { connect } from "middlewares/connect";
import * as z from "zod";

const nc = connect();

const postBodySchema = z.object({
  activityId: z.string(),
});

nc.post(async (req, res) => {
  const { db } = await connectToDatabase();
  const body = postBodySchema.parse(req.body);

  let deviceId = req.cookies.deviceId;
  if (!deviceId) {
    deviceId = new ObjectId().toHexString();
  }

  const sessionId = await startSession(db, body.activityId, deviceId);

  setCookie(res, [
    {
      name: "activitySession",
      value: sessionId,
      options: {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // one week
      },
    },
    {
      name: "deviceId",
      value: deviceId,
      options: {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30 * 3 * 1000, // three month
      },
    },
  ]);

  console.log(res.getHeaders());

  return res.json({
    session: sessionId,
  });
});

export default nc;
