// app.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import MongoStore from "connect-mongo";

// Import API routes
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Import VIEW routes
import adminViewRoutes from "./routes/adminViewRoutes.js";
import userViewRoutes from "./routes/userViewRoutes.js";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =======================
// MIDDLEWARE
// =======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));

// MongoDB URI
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/myDatabase";

// Session middleware with MongoDB store
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongoUri }),
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  })
);

// Make session data available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.admin = req.session.admin || null;
  next();
});

// =======================
// SITE SUSPENSION MIDDLEWARE
// =======================
const isSuspended = true; // Set to false to resume site

app.use((req, res, next) => {
  if (isSuspended && !req.path.startsWith("/admin")) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Site Suspended</title>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: Arial, sans-serif;
            background: #f2f2f2;
            color: #333;
            text-align: center;
          }
          h1 { font-size: 2rem; margin-bottom: 10px; }
          p { font-size: 1.2rem; }
        </style>
      </head>
      <body>
        <div>
          <h1>Site Temporarily Suspended</h1>
          <p>This website has been temporarily suspended due to outstanding payment. Access will be restored once payment is received.</p>
        </div>
      </body>
      </html>
    `);
  }
  next();
});

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// =======================
// API ROUTES
// =======================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/results", resultRoutes);

// =======================
// VIEW ROUTES
// =======================
app.use("/admin", adminViewRoutes);
app.use("/user", userViewRoutes);

// =======================
// PUBLIC PAGES
// =======================
app.get("/", (req, res) => res.render("public/index", { title: "Home" }));
app.get("/about", (req, res) => res.render("public/about", { title: "About" }));
app.get("/check-result", (req, res) => res.render("public/check-result", { title: "Check result" }));
app.get("/contact", (req, res) => res.render("public/contact", { title: "Contact" }));

// =======================
// CONNECT TO MONGODB
// =======================
await connectDB();
console.log("✅ MongoDB connected");

// =======================
// ERROR HANDLING
// =======================

// 404 handler
app.use((req, res) => {
  res.status(404).render("error", {
    message: "Page not found",
    error: { status: 404 },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", {
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
