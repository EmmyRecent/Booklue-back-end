import db from "./db.js";
import passport from "passport";
import bcrypt from "bcrypt";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth20";

// Local strategy.
passport.use(
  "local",
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

// Google strategy.
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, cb) => {
      // User authentication logic.
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile._json.email,
        ]);

        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password_hash, username, profile_picture) VALUES ($1, $2, $3, $4)",
            [profile._json.email, "google", profile._json.name, profile._json.picture]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
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
