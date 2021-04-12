import { connectToDatabase } from "@db";
import { extractPublicUser } from "@utils/user";
import { createUser, findUsers } from "db/users";
import { auth } from "middlewares/auth";
import { connect } from "middlewares/connect";
import { NextApiRequest, NextApiResponse } from "next";
import * as z from "zod";

const handler = connect();

const postSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
});

handler
  .use(auth)
  .get<NextApiRequest & Express.Request, NextApiResponse>(async (req, res) => {
    if (!req.user) {
      return null;
    }
    const { db } = await connectToDatabase();
    const cursor = findUsers(db);
    const users = await cursor.toArray();
    await cursor.close();
    return res.json({
      users: users.map(extractPublicUser),
    });
  })
  .post<NextApiRequest & Express.Request, NextApiResponse>(async (req, res) => {
    if (!req.user) {
      return null;
    }
    const result = postSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({
        errors: result.error.errors,
      });
    }

    const { db } = await connectToDatabase();
    const newUser = await createUser(db, result.data);

    return res.json({
      user: {
        username: newUser.username,
        email: newUser.email,
      },
    });
  });

export default handler;
