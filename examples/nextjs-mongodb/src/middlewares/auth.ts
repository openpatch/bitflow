import nc from "next-connect";
import { passport } from "../utils/passport";
import { session } from "./session";

const auth = nc();

auth.use(session).use(passport.initialize()).use(passport.session());

export { auth };
