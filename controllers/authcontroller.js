import db from "../config/db.js";
import bcrypt from "bcrypt";
import passport from "passport";

const saltRounds = 10;

// Sign up new user
export const signupUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (checkResult.rows.length > 0) {
      res.status(400).json({ message: "User already exists, please login" });
    } else {
      // Hash the password
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.log("Error hashing password", err);

          return res.status(500).json({ message: "Internal server error" });
        }

        try {
          const result = await db.query(
            "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );

          const user = result.rows[0];

          req.login(user, (loginErr) => {
            if (loginErr) {
              console.error("Login error:", loginErr);

              return res.status(500).json({ message: "Login error" });
            }
          });

          // Respond with success message and user details.
          res.status(201).json({
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              name: user.name,
              profile_picture: user.profile_picture,
              bio: user.bio,
            },
            message: "Registration successful",
          });
        } catch (dbError) {
          console.log("Error inserting user into the database:", dbError);

          return res.status(500).json({ message: "Internal server error" });
        }
      });
    }
  } catch (err) {
    console.log("Error during user signup:", err);

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAuthCheck = (req, res) => {
  console.log("Authenticated:", req.isAuthenticated());
  console.log("user:", req.user);

  if (req.isAuthenticated()) {
    res.json({
      isAuthenticated: true,
      user: req.user, // or req.session.user.
    });
  } else {
    res.json({
      isAuthenticated: false,
      user: null,
    });
  }
};
