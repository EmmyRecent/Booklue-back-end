import db from "./db.js";
import passport from "passport";
import bcrypt from "bcrypt";
import { Strategy } from "passport-local";

passport.use(
  new Strategy(
    { usernameField: "email" }, // Use 'email' instead of 'username'

    async function verify(email, password, cb) {
      try {
        const result = await db.query("SELECT * FROM users WHERE email= $1", [email]);

        if (result.rows.length > 0) {
          const user = result.rows[0];
          const storesHashedPassword = user.password_hash;

          bcrypt.compare(password, storesHashedPassword, (err, valid) => {
            if (err) {
              console.error("Error comparing passwords:", err);

              return cb(err);
            }

            if (valid) {
              console.log("password is valid");

              return cb(null, user);
            } else {
              console.log("password is invalid");

              return cb(null, false, { message: "Incorrect password, please try again!" });
            }
          });
        } else {
          console.log("user not found");

          return cb(null, false, { message: "User not found" });
        }
      } catch (err) {
        console.log("Error during authentication");
        console.log(err);

        return cb(err);
      }
    }
  )
);

// Serialize user to store in session
passport.serializeUser((user, cb) => {
  cb(null, user.id); // Store user ID in session.
});

// Deserialize user from session
passport.deserializeUser(async (id, cb) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length > 0) {
      cb(null, result.rows[0]); // Return the full user object.
    } else {
      cb(new Error("User not found!"));
    }
  } catch (err) {
    cb(err);
  }
});

export default passport;
