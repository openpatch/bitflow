import { User, UserDB } from "@schemas/user";
import { get } from "./fetcher";

export const getUser = async (id: string) => {
  return get<{ user: Pick<User, "username" | "email" | "_id"> | null }>(
    "/api/users/" + id
  )
    .then((r) => r.json())
    .then((r) => r.user)
    .catch((e) => {
      return null;
    });
};

export const getUsers = async () => {
  return get<{ users: Pick<User, "username" | "email" | "_id">[] | null }>(
    "/api/users"
  )
    .then((r) => r.json())
    .then((r) => r.users)
    .catch((e) => {
      return null;
    });
};

export const extractPublicUser = (
  user: User | UserDB
): Pick<User, "username" | "email" | "_id"> => {
  if (typeof user._id !== "string") {
    return {
      username: user.username,
      email: user.email,
      _id: user._id.toHexString(),
    };
  }
  return {
    username: user.username,
    email: user.email,
    _id: user._id,
  };
};
