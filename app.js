import express from "express";
import session from "express-session";
import cors from "cors";
import bodyParser from "body-parser";
import apiroutes from "./routes/apiroutes.js";
import authroutes from "./routes/authroutes.js";
import passport from "./config/passport.js";

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for all requests
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 30, // 30 minutes
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true, // Prevent JavaScript from accessing cookies
      sameSite: "strict", // Protects against CSRF attacks
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(apiroutes);
app.use(authroutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
