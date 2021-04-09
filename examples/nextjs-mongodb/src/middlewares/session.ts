import { connectToDatabase } from "@db";
import MongoStore from "connect-mongo";
import expressSession from "express-session";

export const session = async (req: any, res: any, next: any) => {
  const { client } = await connectToDatabase();
  const mongoStore = new MongoStore({
    client: client,
    stringify: false,
  });

  if (!process.env.SESSION_SECRET) {
    throw new Error("No SESSION_SECRET is set.");
  }

  return expressSession({
    secret: process.env.SESSION_SECRET,
    store: mongoStore,
    cookie: {
      sameSite: "lax",
    },
    resave: false,
    saveUninitialized: false,
  })(req, res, next);
};
