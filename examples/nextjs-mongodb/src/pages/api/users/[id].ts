import { connectToDatabase } from "@db";
import { UserSchema } from "@schemas/user";
import { extractPublicUser } from "@utils/user";
import { deleteUser, findUserById, updateUser } from "db/users";
import { auth } from "middlewares/auth";
import { connect } from "middlewares/connect";
import { NextApiRequest, NextApiResponse } from "next";
import * as z from "zod";

const handler = connect();

const putSchema = UserSchema.omit({ _id: true, passwordHash: true }).extend({
  password: z.string().min(8),
});

handler
  .use(auth)
  .get<NextApiRequest & Express.Request, NextApiResponse>(async (req, res) => {
    if (!req.user) {
      return null;
    }
    const { id } = req.query;
    if (typeof id !== "string") {
      return res.status(400).json({
        error: "Id in wrong format",
      });
    }
    const { db } = await connectToDatabase();
    const user = await findUserById(db, id);

    if (!user) {
      return res.end(404);
    }

    return res.json({
      user: extractPublicUser(user),
    });
  })
  .put<NextApiRequest & Express.Request, NextApiResponse>(async (req, res) => {
    if (!req.user) {
      return null;
    }
    const { id } = req.query;
    if (typeof id !== "string") {
      return res.status(400).json({
        error: "Id in wrong format",
      });
    }
    const result = putSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({
        errors: result.error.errors,
      });
    }

    const { db } = await connectToDatabase();
    await updateUser(db, id, result.data);

    return res.json({});
  })
  .delete<NextApiRequest & Express.Request, NextApiResponse>(
    async (req, res) => {
      if (!req.user) {
        return null;
      }
      const { id } = req.query;
      if (typeof id !== "string") {
        return res.status(400).json({
          error: "Id in wrong format",
        });
      }

      const { db } = await connectToDatabase();
      await deleteUser(db, id);

      return res.json({});
    }
  );

export default handler;
