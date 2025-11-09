import express from "express";
import { requireAdminAuth, redirectIfLoggedIn } from "../middleware/renderMiddleware.js";

const router = express.Router();

// ==========================================
// PUBLIC ADMIN ROUTES (Login)
// ==========================================
router.get("/login", redirectIfLoggedIn, (req, res) => {
  res.render("admin/login", { 
    error: null,
    title: "Admin Login"
  });
});

// Handle admin login form submission
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Call API endpoint
    const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Store token and admin info in session
      req.session.adminToken = data.token;
      req.session.admin = data.admin;
      res.redirect('/admin/dashboard');
    } else {
      res.render('admin/login', { 
        error: data.message,
        title: "Admin Login"
      });
    }
  } catch (error) {
    res.render('admin/login', { 
      error: "Login failed. Please try again.",
      title: "Admin Login"
    });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect('/admin/login');
  });
});

// ==========================================
// PROTECTED ADMIN ROUTES
// ==========================================

// Dashboard
router.get("/dashboard", requireAdminAuth, (req, res) => {
  res.render("admin/dashboard", { 
    title: "Admin Dashboard",
    admin: req.admin
  });
});

// PIN Management Page
router.get("/pin-management", requireAdminAuth, (req, res) => {
  res.render("admin/pin-management", { 
    title: "PIN Management",
    admin: req.admin
  });
});

// Students Management
router.get("/students", requireAdminAuth, (req, res) => {
  res.render("admin/students", { 
    title: "Manage Students",
    admin: req.admin
  });
});

// Add Student Page
router.get("/students/add", requireAdminAuth, (req, res) => {
  res.render("admin/add-student", { 
    title: "Add Student",
    admin: req.admin,
    error: null
  });
});

// Results Management
router.get("/results", requireAdminAuth, (req, res) => {
  res.render("admin/results", { 
    title: "Manage Results",
    admin: req.admin
  });
});

// Upload Results
router.get("/results/upload", requireAdminAuth, (req, res) => {
  res.render("admin/upload-results", { 
    title: "Upload Results",
    admin: req.admin,
    error: null
  });
});

// Users Management
router.get("/users", requireAdminAuth, (req, res) => {
  res.render("admin/users", { 
    title: "Manage Users",
    admin: req.admin
  });
});

// Settings
router.get("/settings", requireAdminAuth, (req, res) => {
  res.render("admin/settings", { 
    title: "Settings",
    admin: req.admin
  });
});

export default router;
