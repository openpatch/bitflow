import { ObjectId } from "bson";
import * as z from "zod";

export const UserSchema = z.object({
  _id: z.string(),
  username: z.string(),
  email: z.string().email(),
});

export type User = z.infer<typeof UserSchema>;

export const UserDBSchema = UserSchema.extend({
  _id: z.instanceof(ObjectId),
  passwordHash: z.string(),
});

export type UserDB = z.infer<typeof UserDBSchema>;
