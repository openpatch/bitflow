import { extractPublicUser } from "@utils/user";
import { auth } from "middlewares/auth";
import { connect } from "middlewares/connect";
import { NextApiRequest, NextApiResponse } from "next";

const handler = connect();

handler
  .use(auth)
  .get<NextApiRequest & Express.Request, NextApiResponse>(async (req, res) => {
    if (!req.user) {
      return res.json({
        user: null,
      });
    }

    return res.json({
      user: extractPublicUser(req.user),
    });
  });

export default handler;
