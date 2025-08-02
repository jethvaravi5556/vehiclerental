// === backend/middleware/session.js ===
import session from "express-session";

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "keyboardcat",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  },
});

export default sessionMiddleware;