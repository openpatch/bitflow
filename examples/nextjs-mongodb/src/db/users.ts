import { User, UserDB } from "@schemas/user";
import bcrypt from "bcryptjs";
import { ObjectId } from "bson";
import { Db } from "mongodb";

const collection = "users";

export const countUsers = (db: Db): Promise<number> => {
  return db.collection<User>(collection).count();
};

export const findUsers = (db: Db): Promise<User[]> => {
  return db.collection<User>(collection).find().toArray();
};

export const findUserById = (
  db: Db,
  id: ObjectId | string
): Promise<UserDB | null> => {
  return db.collection<UserDB>(collection).findOne({ _id: new ObjectId(id) });
};

export const findUserByEmailOrUsername = (
  db: Db,
  emailOrUsername: string
): Promise<UserDB | null> => {
  return db.collection<UserDB>(collection).findOne({
    $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
  });
};

export const createUser = async (
  db: Db,
  user: Pick<User, "email" | "username"> & { password: string }
) => {
  if (await db.collection<UserDB>(collection).findOne({ email: user.email })) {
    throw new Error("Email is in use.");
  }

  if (
    await db.collection<User>(collection).findOne({ username: user.username })
  ) {
    throw new Error("Username is in use.");
  }

  const passwordHash = await bcrypt.hash(user.password, 10);

  const newUser = {
    username: user.username,
    email: user.email,
    passwordHash,
  };

  return db
    .collection<Omit<UserDB, "_id">>(collection)
    .insertOne(newUser)
    .then((r) => r.ops[0]);
};

export const updateUser = async (
  db: Db,
  id: ObjectId | string,
  data: Partial<User & { password: string }>
) => {
  const updateUser: Partial<Omit<UserDB, "_id">> = {};
  if (data.password) {
    updateUser.passwordHash = await bcrypt.hash(data.password, 10);
  }
  updateUser.email = data.email;
  updateUser.username = data.username;

  return db
    .collection<UserDB>(collection)
    .updateOne({ _id: new ObjectId(id) }, updateUser);
};

export const deleteUser = async (db: Db, id: ObjectId | string) => {
  return db.collection<UserDB>(collection).deleteOne({ _id: new ObjectId(id) });
};
