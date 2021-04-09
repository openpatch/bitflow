import { connectToDatabase } from "@db";
import bcrypt from "bcryptjs";
import { findUserByEmailOrUsername, findUserById } from "db/users";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

passport.serializeUser<string>(async (user, done) => {
  done(null, user._id.toHexString());
});

passport.deserializeUser<string, any>(async (req, id, done) => {
  const { db } = await connectToDatabase();
  const user = await findUserById(db, id);
  done(null, user);
});

passport.use(
  new LocalStrategy(
    { usernameField: "emailOrUsername", passwordField: "password" },
    async (emailOrUsername, password, done) => {
      const { db } = await connectToDatabase();
      const user = await findUserByEmailOrUsername(db, emailOrUsername);
      if (!user) {
        return done(null, false, { message: "Incorrect email." });
      } else if (await bcrypt.compare(password, user.passwordHash)) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Incorrect password." });
      }
    }
  )
);

export { passport };
