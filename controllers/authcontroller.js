import db from "../config/db.js";
import bcrypt from "bcrypt";
import passport from "passport";

const saltRounds = 10;

// Get users
export const getUser = async (req, res) => {
  const email = req.query.email;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        profile_picture: user.profile_picture,
        bio: user.bio,
      },
    });
  } catch (err) {
    console.error("Get user error:", err);

    return res.status(500).json({ message: "Internal server error!" });
  }
};

// Sign up new user
export const signupUser = async (req, res) => {
  const { email, password, username, profile_picture } = req.body;

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
            "INSERT INTO users (email, password_hash, username, profile_picture) VALUES ($1, $2, $3, $4) RETURNING *",
            [email, hash, username, profile_picture]
          );

          const user = result.rows[0];

          req.login(user, (err) => {
            if (err) {
              console.error("Login error:", loginErr);

              return res.status(500).json({ message: "signup failed" });
            }

            // Respond with success message and user details.
            return res.status(200).json({
              message: "Registration successful",
              user: {
                id: user.id,
                email: user.email,
                username: user.username,
                name: user.name,
                profile_picture: user.profile_picture,
                bio: user.bio,
              },
            });
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

// A function to check if user is logged in or not.
export const getAuthCheck = (req, res) => {
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

// A function to log user out.
export const logoutUser = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed!" });
    }

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not destroy session" });
      }
    });

    res.clearCookie("connect.sid"); // Clear session cookie.
    return res.status(200).json({ message: "Logged out successfully" });
  });
};

export const editProfile = async (req, res) => {
  const { id, photo, username, name, email, bio } = req.body.submission;

  if (!username || !name) {
    return res
      .status(400)
      .json({ message: "Cannot update profile, username and name are required!" });
  }

  try {
    // Update the user profile.
    const result = await db.query(
      "UPDATE users SET profile_picture = $1, username = $2, name = $3, email = $4, bio = $5 WHERE id = $6 RETURNING *;",
      [photo, username, name, email, bio, id]
    );

    const user = result.rows[0];

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        profile_picture: user.profile_picture,
        bio: user.bio,
      },
      message: "Success!",
    });
  } catch (editErr) {
    console.log("Error editing profile:", editErr);

    return res.status(500).json({ message: "Internal server error" });
  }
};
