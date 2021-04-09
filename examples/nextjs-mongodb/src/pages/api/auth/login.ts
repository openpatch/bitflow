import { passport } from "@utils/passport";
import { extractPublicUser } from "@utils/user";
import { auth } from "middlewares/auth";
import { connect } from "middlewares/connect";
import { NextApiRequest, NextApiResponse } from "next";

const handler = connect();

handler
  .use(auth)
  .post<NextApiRequest & Express.Request, NextApiResponse>(
    passport.authenticate("local"),
    async (req, res) => {
      if (!req.user) {
        return null;
      }
      return res.json({
        user: extractPublicUser(req.user),
      });
    }
  );

export default handler;
