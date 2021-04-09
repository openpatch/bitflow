import { ErrorNotFound } from "@errors";
import { NextApiRequest, NextApiResponse } from "next";
import nextConnect, { ErrorHandler } from "next-connect";

const onNoMatch = (req: NextApiRequest, res: NextApiResponse) => {
  return ErrorNotFound(res);
};

const onError: ErrorHandler<NextApiRequest, NextApiResponse> = (
  err,
  req,
  res,
  next
) => {
  res.status(500).end(err.toString());
};

export const connect = <Res = any>() =>
  nextConnect<NextApiRequest, NextApiResponse<Res>>({
    onNoMatch,
    onError,
  });
