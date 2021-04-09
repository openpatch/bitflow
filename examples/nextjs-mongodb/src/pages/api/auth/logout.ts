import { auth } from "middlewares/auth";
import { connect } from "middlewares/connect";
import { NextApiRequest, NextApiResponse } from "next";

const handler = connect();

handler
  .use(auth)
  .post<NextApiRequest & Express.Request, NextApiResponse>(async (req, res) => {
    req.logOut();
    res.status(204).end();
  });

export default handler;
