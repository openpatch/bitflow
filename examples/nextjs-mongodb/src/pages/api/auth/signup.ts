import { connectToDatabase } from "@db";
import { extractPublicUser } from "@utils/user";
import { createUser } from "db/users";
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
  .post<NextApiRequest & Express.Request, NextApiResponse>(async (req, res) => {
    const result = postSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        errors: result.error.errors,
      });
    }

    const { db } = await connectToDatabase();
    const newUser = await createUser(db, result.data);

    req.login(newUser, (err: any) => {
      if (err) throw err;

      res.status(201).json({
        user: extractPublicUser(newUser),
      });
    });
  });

export default handler;
