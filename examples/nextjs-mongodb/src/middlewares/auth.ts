import nc from "next-connect";
import { IncomingMessage, ServerResponse } from "node:http";
import { passport } from "../utils/passport";
import { session } from "./session";

const auth = nc();

auth.use(session).use(passport.initialize()).use(passport.session());

type RunAuth = (
  req: IncomingMessage,
  res: ServerResponse
) => Promise<Express.User | null>;
const runAuth: RunAuth = async (req, res) => {
  await auth.run(req, res);
  const authReq = req as IncomingMessage & Express.Request;
  if (!authReq.user) {
    return null;
  }
  return authReq.user;
};

export { auth, runAuth };
