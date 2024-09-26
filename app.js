import express from "express";
import session from "express-session";
import cors from "cors";
import bodyParser from "body-parser";
import apiroutes from "./routes/apiroutes.js";
import authroutes from "./routes/authroutes.js";
import passport from "./config/passport.js";
import { Server } from "socket.io";
import { createServer } from "http";
import { disconnect } from "process";
import dotenv from "dotenv";

// Load environment variables.
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
// Server http instance to wrap the express app
const server = createServer(app);
// socket.io on the server.
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Socket.io instance in the app context so it can be used in controllers.
app.set("socketio", io);

// Enable CORS for all requests
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 30, // 30 minutes
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true, // Prevent JavaScript from accessing cookies
      sameSite: "strict", // Protects against CSRF attacks
    },
  })
);

// Initialize passport for authentication.
app.use(passport.initialize());
app.use(passport.session());

// Use routes.
app.use(apiroutes);
app.use(authroutes);

// Handle socket connections.
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on(disconnect, () => {
    console.log("User disconnected:", socket.id);
  });
});

// Starting the server with socket.io
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
