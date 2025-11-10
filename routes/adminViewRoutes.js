import express from "express";
import { requireAdminAuth, redirectIfLoggedIn } from "../middleware/renderMiddleware.js";
import Admin from "../models/adminModel.js";
import Student from "../models/studentModel.js";
import Result from "../models/resultModel.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// ==========================================
// ADMIN LOGIN & LOGOUT (No Auth Required)
// ==========================================
// Handle form submission
router.post("/add-user", requireAdminAuth, async (req, res) => {
  try {
    const { name, email, password, role, studentId, phoneNumber } = req.body;

    // Check required fields
    if (!name || !email || !password || !role) {
      return res.redirect("/admin/add-user?error=Name, email, password, and role are required");
    }

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.redirect("/admin/add-user?error=Email already registered");
    }

    // Validate student ID if role requires it
    let studentRef = undefined;
    if ((role === "student" || role === "parent") && studentId) {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.redirect("/admin/add-user?error=Student not found");
      }
      studentRef = student._id;
    }

    // Create the user
    await User.create({
      name,
      email,
      password,
      role,
      student: studentRef,
      phoneNumber
    });

    // Redirect to users list with success message
    res.redirect("/admin/users?success=User added successfully");

  } catch (err) {
    res.redirect("/admin/add-user?error=Failed to add user: " + err.message);
  }
});



// Show login page
router.get("/login", redirectIfLoggedIn, (req, res) => {
  res.render("admin/login", { 
    error: null,
    title: "Admin Login"
  });
});

// Process login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.render("admin/login", { 
        error: "Email and password are required",
        title: "Admin Login"
      });
    }
    
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.render("admin/login", { 
        error: "Invalid email or password",
        title: "Admin Login"
      });
    }
    
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.render("admin/login", { 
        error: "Invalid email or password",
        title: "Admin Login"
      });
    }
    
    // Generate token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });
    
    // Save to session
    req.session.admin = {
      _id: admin._id,
      name: admin.name,
      email: admin.email
    };
    req.session.adminToken = token;
    
    res.redirect("/admin/dashboard");
  } catch (error) {
    res.render("admin/login", { 
      error: "Login failed: " + error.message,
      title: "Admin Login"
    });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
    res.redirect("/admin/login");
  });
});

// ==========================================
// ADMIN DASHBOARD (Auth Required)
// ==========================================

router.get("/dashboard", requireAdminAuth, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalResults = await Result.countDocuments();
    
    const recentStudents = await Student.find().sort({ createdAt: -1 }).limit(5);
    
    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      admin: req.admin,
      adminToken: req.session.adminToken, // ✅ Added
      stats: {
        totalStudents,
        totalUsers,
        totalResults
      },
      recentStudents
    });
  } catch (error) {
    res.render("error", { message: error.message });
  }
});

// ==========================================
// STUDENT MANAGEMENT
// ==========================================

// List all students
router.get("/students", requireAdminAuth, async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    
    res.render("admin/students", {
      title: "Students Management",
      admin: req.admin,
      adminToken: req.session.adminToken, // ✅ Added
      students,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    res.render("error", { message: error.message });
  }
});

// Show add student form
router.get("/students/add", requireAdminAuth, (req, res) => {
  res.render("admin/add-student", {
    title: "Add New Student",
    admin: req.admin,
    adminToken: req.session.adminToken, // ✅ Added
    error: null
  });
});

// Process add student
router.post("/students/add", requireAdminAuth, async (req, res) => {
  try {
    const { name, classLevel, session, regNumber, gender, dateOfBirth, address, parentName, parentPhone, parentEmail } = req.body;
    
    // Check if reg number exists
    const existing = await Student.findOne({ regNumber });
    if (existing) {
      return res.render("admin/add-student", {
        title: "Add New Student",
        admin: req.admin,
        adminToken: req.session.adminToken, // ✅ Added
        error: "Registration number already exists"
      });
    }
    
    await Student.create({
      name,
      classLevel,
      session,
      regNumber,
      gender,
      dateOfBirth,
      address,
      parentName,
      parentPhone,
      parentEmail
    });
    
    res.redirect("/admin/students?success=Student added successfully");
  } catch (error) {
    res.render("admin/add-student", {
      title: "Add New Student",
      admin: req.admin,
      adminToken: req.session.adminToken, // ✅ Added
      error: error.message
    });
  }
});

// Show edit student form
router.get("/students/edit/:id", requireAdminAuth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.redirect("/admin/students?error=Student not found");
    }
    
    res.render("admin/edit-student", {
      title: "Edit Student",
      admin: req.admin,
      adminToken: req.session.adminToken, // ✅ Added
      student,
      error: null
    });
  } catch (error) {
    res.redirect("/admin/students?error=" + error.message);
  }
});

// Process edit student
router.post("/students/edit/:id", requireAdminAuth, async (req, res) => {
  try {
    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (!updated) {
      return res.redirect("/admin/students?error=Student not found");
    }
    
    res.redirect("/admin/students?success=Student updated successfully");
  } catch (error) {
    res.redirect("/admin/students?error=" + error.message);
  }
});

// Delete student
router.post("/students/delete/:id", requireAdminAuth, async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.redirect("/admin/students?success=Student deleted successfully");
  } catch (error) {
    res.redirect("/admin/students?error=" + error.message);
  }
});

// ==========================================
// RESULT MANAGEMENT
// ==========================================

// Show upload result form
router.get("/results/upload", requireAdminAuth, async (req, res) => {
  try {
    const students = await Student.find().sort({ name: 1 });
    
    res.render("admin/upload-result", {
      title: "Upload Result",
      admin: req.admin,
      adminToken: req.session.adminToken, // ✅ CRITICAL: Added for API calls
      students,
      error: null,
      success: req.query.success
    });
  } catch (error) {
    res.render("error", { message: error.message });
  }
});

// View all results
router.get("/results", requireAdminAuth, async (req, res) => {
  try {
    const students = await Student.find().sort({ name: 1 });
    const results = [];
    
    // Get results for each student
    for (const student of students) {
      const result = await Result.findOne({ student: student._id });
      if (result) {
        results.push({
          student,
          result
        });
      }
    }
    
    res.render("admin/view-results", {
      title: "View Results",
      admin: req.admin,
      adminToken: req.session.adminToken, // ✅ Added
      results
    });
  } catch (error) {
    res.render("error", { message: error.message });
  }
});

// ==========================================
// USER MANAGEMENT
// ==========================================

router.get("/users", requireAdminAuth, async (req, res) => {
  try {
    const users = await User.find()
      .populate("student", "name regNumber classLevel")
      .sort({ createdAt: -1 });
    
    res.render("admin/users", {
      title: "User Management",
      admin: req.admin,
      adminToken: req.session.adminToken, // ✅ Added
      users,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    res.render("error", { message: error.message });
  }
});

// ==========================================
// SETTINGS
// ==========================================

router.get("/settings", requireAdminAuth, (req, res) => {
  res.render("admin/settings", {
    title: "Settings",
    admin: req.admin,
    adminToken: req.session.adminToken, // ✅ Added
    success: req.query.success,
    error: req.query.error
  });
});

// Change password
router.post("/settings/change-password", requireAdminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (newPassword !== confirmPassword) {
      return res.redirect("/admin/settings?error=Passwords do not match");
    }
    
    if (newPassword.length < 6) {
      return res.redirect("/admin/settings?error=Password must be at least 6 characters");
    }
    
    const admin = await Admin.findById(req.admin._id);
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    
    if (!isMatch) {
      return res.redirect("/admin/settings?error=Current password is incorrect");
    }
    
    admin.password = newPassword;
    await admin.save();
    
    res.redirect("/admin/settings?success=Password changed successfully");
  } catch (error) {
    res.redirect("/admin/settings?error=" + error.message);
  }
});

// ==========================================
// PROFILE
// ==========================================

router.get("/profile", requireAdminAuth, (req, res) => {
  res.render("admin/profile", {
    title: "My Profile",
    admin: req.admin,
    adminToken: req.session.adminToken, // ✅ Added
    success: req.query.success,
    error: req.query.error
  });
});

router.post("/profile", requireAdminAuth, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const admin = await Admin.findByIdAndUpdate(
      req.admin._id,
      { name, email },
      { new: true }
    );
    
    req.session.admin = {
      _id: admin._id,
      name: admin.name,
      email: admin.email
    };
    
    res.redirect("/admin/profile?success=Profile updated successfully");
  } catch (error) {
    res.redirect("/admin/profile?error=" + error.message);
  }
});
router.get("/add-user", requireAdminAuth, async (req, res) => {
  const students = await Student.find().select("name regNumber");
  res.render("admin/add-user", { title: "Add User", students, error: null, success: null });
});

// Handle form submission
router.post("/add-user", requireAdminAuth, async (req, res) => {
  try {
    const { name, email, password, role, studentId, phoneNumber } = req.body;
    // You can reuse your registerUser logic here
    res.render("admin/add-user", { 
      title: "Add User", 
      students: await Student.find().select("name regNumber"),
      success: "User added successfully!",
      error: null 
    });
  } catch (err) {
    res.render("admin/add-user", { 
      title: "Add User", 
      students: await Student.find().select("name regNumber"),
      error: "Failed to add user.",
      success: null 
    });
  }
});

export default router;
