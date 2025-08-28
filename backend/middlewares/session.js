// === backend/middleware/session.js ===
import session from "express-session";
import MongoStore from "connect-mongo";
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "keyboardcat",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "none",
    maxAge:  7 * 24 * 60 * 60 * 1000,
  },
});

export default sessionMiddleware;