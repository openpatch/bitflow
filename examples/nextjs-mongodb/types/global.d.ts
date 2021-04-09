import { UserDB } from "@schemas/user";
import { Db, MongoClient } from "mongodb";

type DBConnection = { client: MongoClient; db: Db };
declare global {
  namespace Express {
    interface User extends UserDB {}
  }
  namespace NodeJS {
    interface Global {
      mongo: {
        promise: Promise<DBConnection> | null;
        conn: DBConnection | null;
      };
    }
  }
}
